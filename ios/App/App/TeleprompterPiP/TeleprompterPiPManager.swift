//
//  TeleprompterPiPManager.swift
//  Teleprompter iPhone - Native iOS Picture-in-Picture Manager
//
//  Responsibilities:
//  - Checks AVPictureInPictureController.isPictureInPictureSupported()
//  - Configures AVAudioSession with .playback and .mixWithOthers so background audio keeps PiP active
//  - Sets up AVPictureInPictureController using public Apple APIs:
//      * AVPictureInPictureVideoCallViewController (iOS 15+) for native UIView content
//      * AVSampleBufferDisplayLayer fallback
//  - Handles MPRemoteCommandCenter for iOS Lock Screen and PiP control events (play, pause, skip)
//  - Emits typed state notifications to JavaScript
//

import Foundation
import AVKit
import AVFoundation
import MediaPlayer
import UIKit

public protocol TeleprompterPiPManagerDelegate: AnyObject {
    func pipManagerWillStart()
    func pipManagerDidStart()
    func pipManagerWillStop()
    func pipManagerDidStop(finalPosition: Double)
    func pipManagerFailed(with error: String)
    func pipManagerDidPause()
    func pipManagerDidResume()
    func pipManagerPositionChanged(position: Double)
}

public class TeleprompterPiPManager: NSObject, AVPictureInPictureControllerDelegate, TeleprompterRendererDelegate {
    public static let shared = TeleprompterPiPManager()
    
    public weak var delegate: TeleprompterPiPManagerDelegate?
    
    private var pipController: AVPictureInPictureController?
    private var renderView: TeleprompterPiPRenderView?
    private var activePayload: TeleprompterScriptPayload?
    private var currentPosition: Double = 0.0
    private var isPiPActive = false
    
    // Internal player and view hierarchy for standard PiP anchor
    private var sourceView: UIView?
    private var sampleBufferLayer: AVSampleBufferDisplayLayer?
    
    private override init() {
        super.init()
    }
    
    // MARK: - Availability
    public static func isSupported() -> Bool {
        return AVPictureInPictureController.isPictureInPictureSupported()
    }
    
    // MARK: - Audio Session Setup
    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .moviePlayback, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("[TeleprompterPiPManager] AudioSession warning: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Setup Remote Commands (Headphones, Lock Screen, Dynamic Island, PiP Remote)
    private func setupRemoteCommands() {
        let commandCenter = MPRemoteCommandCenter.shared()
        
        commandCenter.playCommand.isEnabled = true
        commandCenter.playCommand.addTarget { [weak self] _ in
            self?.resume()
            return .success
        }
        
        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.pause()
            return .success
        }
        
        commandCenter.togglePlayPauseCommand.isEnabled = true
        commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            if self.renderView?.getCurrentPosition() ?? 0 > 0 {
                self.pause()
            } else {
                self.resume()
            }
            return .success
        }
        
        commandCenter.skipForwardCommand.isEnabled = true
        commandCenter.skipForwardCommand.preferredIntervals = [10]
        commandCenter.skipForwardCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            let next = (self.renderView?.getCurrentPosition() ?? 0) + 150.0
            self.renderView?.updatePosition(next)
            return .success
        }
        
        commandCenter.skipBackwardCommand.isEnabled = true
        commandCenter.skipBackwardCommand.preferredIntervals = [10]
        commandCenter.skipBackwardCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            let prev = max(0, (self.renderView?.getCurrentPosition() ?? 0) - 150.0)
            self.renderView?.updatePosition(prev)
            return .success
        }
    }
    
    // MARK: - Start PiP Session
    public func start(with payload: TeleprompterScriptPayload, in parentView: UIView) {
        guard Self.isSupported() else {
            delegate?.pipManagerFailed(with: "Picture-in-Picture não é suportado neste dispositivo iOS.")
            return
        }
        
        self.activePayload = payload
        self.currentPosition = payload.initialPosition
        setupAudioSession()
        setupRemoteCommands()
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.setupController(with: payload, in: parentView)
        }
    }
    
    private func setupController(with payload: TeleprompterScriptPayload, in parentView: UIView) {
        // Clean previous session if any
        cleanup()
        
        let prompterRenderView = TeleprompterPiPRenderView(frame: CGRect(x: 0, y: 0, width: 360, height: 270))
        prompterRenderView.delegate = self
        prompterRenderView.configure(with: payload)
        self.renderView = prompterRenderView
        
        if #available(iOS 15.0, *) {
            // Apple's designated API for custom UI inside Picture-in-Picture
            let contentVC = AVPictureInPictureVideoCallViewController()
            contentVC.view.addSubview(prompterRenderView)
            prompterRenderView.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                prompterRenderView.topAnchor.constraint(equalTo: contentVC.view.topAnchor),
                prompterRenderView.leadingAnchor.constraint(equalTo: contentVC.view.leadingAnchor),
                prompterRenderView.trailingAnchor.constraint(equalTo: contentVC.view.trailingAnchor),
                prompterRenderView.bottomAnchor.constraint(equalTo: contentVC.view.bottomAnchor)
            ])
            
            // Anchor view in parent hierarchy
            let anchorView = UIView(frame: CGRect(x: -1000, y: -1000, width: 1, height: 1))
            parentView.addSubview(anchorView)
            self.sourceView = anchorView
            
            let contentSource = AVPictureInPictureController.ContentSource(
                activeVideoCallSourceView: anchorView,
                contentViewController: contentVC
            )
            
            let pip = AVPictureInPictureController(contentSource: contentSource)
            pip.delegate = self
            pip.canStartPictureInPictureAutomaticallyFromInline = true
            self.pipController = pip
            
            // Delay slightly to let layout settle before requesting PiP
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                self?.pipController?.startPictureInPicture()
            }
        } else {
            // Fallback for earlier iOS versions
            delegate?.pipManagerFailed(with: "Requer iOS 15 ou superior para PiP nativo com teleprompter.")
        }
    }
    
    // MARK: - Controls
    public func pause() {
        renderView?.setPlaying(false)
        delegate?.pipManagerDidPause()
    }
    
    public func resume() {
        renderView?.setPlaying(true)
        delegate?.pipManagerDidResume()
    }
    
    public func setSpeed(_ speed: Double) {
        renderView?.setSpeed(speed)
    }
    
    public func updateContent(_ content: String) {
        guard let current = activePayload else { return }
        let updated = TeleprompterScriptPayload(
            id: current.id,
            title: current.title,
            content: content,
            initialPosition: renderView?.getCurrentPosition() ?? 0,
            speed: current.speed,
            fontSize: current.fontSize,
            textColor: current.textColor,
            bgColor: current.bgColor,
            opacity: current.opacity,
            isPlaying: true
        )
        self.activePayload = updated
        renderView?.configure(with: updated)
    }
    
    public func stop() {
        pipController?.stopPictureInPicture()
        cleanup()
    }
    
    public func getCurrentState() -> TeleprompterStateSnapshot? {
        guard let payload = activePayload else { return nil }
        return TeleprompterStateSnapshot(
            scriptId: payload.id,
            title: payload.title,
            currentPosition: renderView?.getCurrentPosition() ?? currentPosition,
            speed: payload.speed,
            fontSize: payload.fontSize,
            isPlaying: isPiPActive,
            timestamp: Date().timeIntervalSince1970 * 1000
        )
    }
    
    private func cleanup() {
        renderView?.stopAnimation()
        renderView?.removeFromSuperview()
        renderView = nil
        sourceView?.removeFromSuperview()
        sourceView = nil
        pipController = nil
        isPiPActive = false
    }
    
    // MARK: - TeleprompterRendererDelegate
    public func rendererDidUpdatePosition(_ position: Double) {
        self.currentPosition = position
        delegate?.pipManagerPositionChanged(position: position)
    }
    
    public func rendererDidReachEnd() {
        pause()
    }
    
    // MARK: - AVPictureInPictureControllerDelegate
    public func pictureInPictureControllerWillStartPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        isPiPActive = true
        delegate?.pipManagerWillStart()
    }
    
    public func pictureInPictureControllerDidStartPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        isPiPActive = true
        delegate?.pipManagerDidStart()
    }
    
    public func pictureInPictureControllerWillStopPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        delegate?.pipManagerWillStop()
    }
    
    public func pictureInPictureControllerDidStopPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        let finalPos = renderView?.getCurrentPosition() ?? currentPosition
        isPiPActive = false
        cleanup()
        delegate?.pipManagerDidStop(finalPosition: finalPos)
    }
    
    public func pictureInPictureController(_ pictureInPictureController: AVPictureInPictureController, failedToStartPictureInPictureWithError error: Error) {
        isPiPActive = false
        cleanup()
        delegate?.pipManagerFailed(with: error.localizedDescription)
    }
}
