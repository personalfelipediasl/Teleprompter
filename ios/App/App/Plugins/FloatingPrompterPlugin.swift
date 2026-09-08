//
//  FloatingPrompterPlugin.swift
//  Teleprompter iPhone - Native iOS Layer
//
//  Implemented using official Apple Public APIs:
//  - AVKit (AVPictureInPictureController)
//  - AVPictureInPictureVideoCallViewController (iOS 15+)
//  - AVFoundation (AVAudioSession with .playback and .mixWithOthers)
//

import Foundation
import AVKit
import UIKit

@objc(FloatingPrompterPlugin)
public class FloatingPrompterPlugin: NSObject {
    
    @objc public func isSupported(_ call: Any) {
        let supported = TeleprompterPiPManager.isSupported()
        respond(call: call, data: ["supported": supported])
    }

    @objc public func startFloating(_ call: Any) {
        let params = extractDictionary(from: call)
        let id = params["id"] as? String ?? UUID().uuidString
        let title = params["scriptTitle"] as? String ?? params["title"] as? String ?? "Roteiro"
        let content = params["content"] as? String ?? ""
        let initialPosition = params["initialPosition"] as? Double ?? 0.0
        let speed = params["speed"] as? Double ?? 1.0
        let fontSize = params["fontSize"] as? Double ?? 32.0
        let textColor = params["textColor"] as? String ?? "#FFFFFF"
        let bgColor = params["bgColor"] as? String ?? "#121318"
        let opacity = params["opacity"] as? Double ?? 1.0
        let isPlaying = params["isPlaying"] as? Bool ?? true
        
        let payload = TeleprompterScriptPayload(
            id: id,
            title: title,
            content: content,
            initialPosition: initialPosition,
            speed: speed,
            fontSize: fontSize,
            textColor: textColor,
            bgColor: bgColor,
            opacity: opacity,
            isPlaying: isPlaying
        )
        
        DispatchQueue.main.async {
            guard let keyWindow = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) ?? UIApplication.shared.windows.first else {
                return
            }
            TeleprompterPiPManager.shared.start(with: payload, in: keyWindow)
            self.respond(call: call, data: ["success": true])
        }
    }

    @objc public func updateSettings(_ call: Any) {
        let params = extractDictionary(from: call)
        if let speed = params["speed"] as? Double {
            TeleprompterPiPManager.shared.setSpeed(speed)
        }
        if let content = params["content"] as? String {
            TeleprompterPiPManager.shared.updateContent(content)
        }
        respond(call: call, data: ["success": true])
    }

    @objc public func stopFloating(_ call: Any) {
        DispatchQueue.main.async {
            TeleprompterPiPManager.shared.stop()
            self.respond(call: call, data: ["success": true])
        }
    }
    
    private func extractDictionary(from call: Any) -> [String: Any] {
        if let dict = call as? [String: Any] { return dict }
        let mirror = Mirror(reflecting: call)
        for child in mirror.children {
            if child.label == "options", let dict = child.value as? [String: Any] {
                return dict
            }
        }
        return [:]
    }
    
    private func respond(call: Any, data: [String: Any]) {
        if let selector = NSSelectorFromString("resolve:") as Selector?,
           (call as AnyObject).responds(to: selector) {
            _ = (call as AnyObject).perform(selector, with: data)
        }
    }
}
