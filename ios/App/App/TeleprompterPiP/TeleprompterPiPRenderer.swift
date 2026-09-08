//
//  TeleprompterPiPRenderer.swift
//  Teleprompter iPhone - High Performance Native PiP Text Renderer
//
//  Responsibilities:
//  1. Continuous 60 FPS rendering via CADisplayLink on the main/render thread.
//  2. Word-wrapping and typographic layout for reading on iPhone screen dimensions.
//  3. High-contrast display: clean dark background with crisp white text.
//  4. Independent execution: continues scrolling even when the WebView is backgrounded.
//

import UIKit
import CoreMedia

public protocol TeleprompterRendererDelegate: AnyObject {
    func rendererDidUpdatePosition(_ position: Double)
    func rendererDidReachEnd()
}

public class TeleprompterPiPRenderView: UIView {
    public weak var delegate: TeleprompterRendererDelegate?
    
    // Configuration
    private var scriptTitle: String = ""
    private var formattedLines: [String] = []
    private var currentScrollY: CGFloat = 0.0
    private var scrollSpeed: CGFloat = 1.0
    private var fontSize: CGFloat = 32.0
    private var textColor: UIColor = .white
    private var bgColor: UIColor = UIColor(red: 0.07, green: 0.07, blue: 0.09, alpha: 1.0)
    private var isPlaying: Bool = true
    
    private var displayLink: CADisplayLink?
    private var lastTimestamp: CFTimeInterval = 0.0
    
    // UI Elements
    private let titleLabel = UILabel()
    private let contentStack = UIStackView()
    private let pillView = UIView()
    private let pillLabel = UILabel()
    
    public override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        backgroundColor = bgColor
        clipsToBounds = true
        
        // Top Pill: "Double click to continue scrolling"
        pillView.backgroundColor = UIColor(red: 0.0, green: 0.53, blue: 1.0, alpha: 1.0)
        pillView.layer.cornerRadius = 14
        pillView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(pillView)
        
        pillLabel.text = "Double click to continue scrolling"
        pillLabel.font = UIFont.systemFont(ofSize: 13, weight: .bold)
        pillLabel.textColor = .white
        pillLabel.textAlignment = .center
        pillLabel.translatesAutoresizingMaskIntoConstraints = false
        pillView.addSubview(pillLabel)
        
        NSLayoutConstraint.activate([
            pillView.topAnchor.constraint(equalTo: topAnchor, constant: 10),
            pillView.centerXAnchor.constraint(equalTo: centerXAnchor),
            pillView.heightAnchor.constraint(equalToConstant: 28),
            pillView.widthAnchor.constraint(lessThanOrEqualTo: widthAnchor, constant: -32),
            
            pillLabel.leadingAnchor.constraint(equalTo: pillView.leadingAnchor, constant: 14),
            pillLabel.trailingAnchor.constraint(equalTo: pillView.trailingAnchor, constant: -14),
            pillLabel.centerYAnchor.constraint(equalTo: pillView.centerYAnchor)
        ])
    }
    
    public func configure(with payload: TeleprompterScriptPayload) {
        self.scriptTitle = payload.title.uppercased()
        self.scrollSpeed = CGFloat(max(0.1, payload.speed))
        self.fontSize = CGFloat(max(20, min(54, payload.fontSize)))
        self.currentScrollY = CGFloat(payload.initialPosition)
        self.isPlaying = payload.isPlaying
        
        // Parse and wrap lines
        let rawLines = payload.content.components(separatedBy: .newlines)
        self.formattedLines = rawLines.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        
        setNeedsDisplay()
        if isPlaying {
            startAnimation()
        }
    }
    
    public func setPlaying(_ playing: Bool) {
        self.isPlaying = playing
        if playing {
            startAnimation()
        } else {
            stopAnimation()
        }
    }
    
    public func setSpeed(_ speed: Double) {
        self.scrollSpeed = CGFloat(max(0.1, min(5.0, speed)))
    }
    
    public func getCurrentPosition() -> Double {
        return Double(currentScrollY)
    }
    
    public func updatePosition(_ position: Double) {
        self.currentScrollY = CGFloat(position)
        setNeedsDisplay()
    }
    
    public func startAnimation() {
        guard displayLink == nil else { return }
        lastTimestamp = 0
        displayLink = CADisplayLink(target: self, selector: #selector(handleDisplayLink(_:)))
        displayLink?.preferredFramesPerSecond = 60
        displayLink?.add(to: .main, forMode: .common)
    }
    
    public func stopAnimation() {
        displayLink?.invalidate()
        displayLink = nil
    }
    
    @objc private func handleDisplayLink(_ link: CADisplayLink) {
        guard isPlaying else { return }
        
        if lastTimestamp == 0 {
            lastTimestamp = link.timestamp
            return
        }
        
        let dt = CGFloat(link.timestamp - lastTimestamp)
        lastTimestamp = link.timestamp
        
        let step = scrollSpeed * 50.0 * dt
        currentScrollY += step
        
        delegate?.rendererDidUpdatePosition(Double(currentScrollY))
        setNeedsDisplay()
    }
    
    public override func draw(_ rect: CGRect) {
        guard let ctx = UIGraphicsGetCurrentContext() else { return }
        
        // Fill background
        ctx.setFillColor(bgColor.cgColor)
        ctx.fill(rect)
        
        let titleFont = UIFont.systemFont(ofSize: 22, weight: .black)
        let bodyFont = UIFont.systemFont(ofSize: fontSize, weight: .bold)
        
        let titleAttrs: [NSAttributedString.Key: Any] = [
            .font: titleFont,
            .foregroundColor: UIColor.white
        ]
        
        let bodyAttrs: [NSAttributedString.Key: Any] = [
            .font: bodyFont,
            .foregroundColor: textColor
        ]
        
        let sidePadding: CGFloat = 20.0
        let availableWidth = rect.width - (sidePadding * 2)
        var yOffset: CGFloat = 50.0 - currentScrollY
        
        // Title Header
        let displayTitle = scriptTitle.starts(with: "🎥") ? scriptTitle : "🎥 \(scriptTitle)"
        let titleRect = (displayTitle as NSString).boundingRect(
            with: CGSize(width: availableWidth, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: titleAttrs,
            context: nil
        )
        
        if yOffset + titleRect.height > 0 && yOffset < rect.height {
            (displayTitle as NSString).draw(
                in: CGRect(x: sidePadding, y: yOffset, width: availableWidth, height: titleRect.height),
                withAttributes: titleAttrs
            )
        }
        yOffset += titleRect.height + 24.0
        
        // Body lines
        for line in formattedLines {
            let lineRect = (line as NSString).boundingRect(
                with: CGSize(width: availableWidth, height: .greatestFiniteMagnitude),
                options: [.usesLineFragmentOrigin, .usesFontLeading],
                attributes: bodyAttrs,
                context: nil
            )
            
            if yOffset + lineRect.height > 0 && yOffset < rect.height {
                (line as NSString).draw(
                    in: CGRect(x: sidePadding, y: yOffset, width: availableWidth, height: lineRect.height),
                    withAttributes: bodyAttrs
                )
            }
            yOffset += lineRect.height + 14.0
        }
    }
    
    deinit {
        stopAnimation()
    }
}
