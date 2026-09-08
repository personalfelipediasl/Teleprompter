//
//  TeleprompterPiPPlugin.swift
//  Teleprompter iPhone - Capacitor Plugin Bridge
//
//  Bridges TypeScript calls from the Web App to the native iOS AVKit PiP subsystem.
//

import Foundation
import UIKit
import AVKit

// Note: In Capacitor projects, Capacitor headers are provided by the CocoaPods / SPM build system.
// We define the bridging interface cleanly so it compiles and binds to the Capacitor runtime.

@objc(TeleprompterPiPPlugin)
public class TeleprompterPiPPlugin: NSObject, TeleprompterPiPManagerDelegate {
    
    // Callbacks dictionary for JS event notifications
    private var eventListeners: [String: [([String: Any]) -> Void]] = [:]
    
    public override init() {
        super.init()
        TeleprompterPiPManager.shared.delegate = self
    }
    
    // MARK: - Plugin Methods
    
    @objc public func isSupported(_ call: Any) {
        let supported = TeleprompterPiPManager.isSupported()
        let result: [String: Any] = [
            "supported": supported,
            "iosVersion": UIDevice.current.systemVersion,
            "deviceModel": UIDevice.current.model
        ]
        respond(call: call, data: result)
    }
    
    @objc public func start(_ call: Any) {
        let params = extractDictionary(from: call)
        let id = params["id"] as? String ?? UUID().uuidString
        let title = params["title"] as? String ?? "Roteiro"
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
                self.respondError(call: call, message: "Não foi possível localizar a janela principal do iOS.")
                return
            }
            
            TeleprompterPiPManager.shared.start(with: payload, in: keyWindow)
            self.respond(call: call, data: ["success": true])
        }
    }
    
    @objc public func stop(_ call: Any) {
        DispatchQueue.main.async {
            TeleprompterPiPManager.shared.stop()
            self.respond(call: call, data: ["success": true])
        }
    }
    
    @objc public func pause(_ call: Any) {
        DispatchQueue.main.async {
            TeleprompterPiPManager.shared.pause()
            self.respond(call: call, data: ["success": true])
        }
    }
    
    @objc public func resume(_ call: Any) {
        DispatchQueue.main.async {
            TeleprompterPiPManager.shared.resume()
            self.respond(call: call, data: ["success": true])
        }
    }
    
    @objc public func setSpeed(_ call: Any) {
        let params = extractDictionary(from: call)
        let speed = params["speed"] as? Double ?? 1.0
        DispatchQueue.main.async {
            TeleprompterPiPManager.shared.setSpeed(speed)
            self.respond(call: call, data: ["success": true])
        }
    }
    
    @objc public func updateContent(_ call: Any) {
        let params = extractDictionary(from: call)
        let content = params["content"] as? String ?? ""
        DispatchQueue.main.async {
            TeleprompterPiPManager.shared.updateContent(content)
            self.respond(call: call, data: ["success": true])
        }
    }
    
    @objc public func getState(_ call: Any) {
        let state = TeleprompterPiPManager.shared.getCurrentState()
        self.respond(call: call, data: state?.toDictionary() ?? [:])
    }
    
    // MARK: - Helpers to handle both raw ObjC and Capacitor Plugin Call signatures
    private func extractDictionary(from call: Any) -> [String: Any] {
        if let dict = call as? [String: Any] {
            return dict
        }
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
    
    private func respondError(call: Any, message: String) {
        if let selector = NSSelectorFromString("reject:") as Selector?,
           (call as AnyObject).responds(to: selector) {
            _ = (call as AnyObject).perform(selector, with: message)
        }
    }
    
    private func emitEvent(name: String, data: [String: Any]) {
        // Post notification locally & via Capacitor notifyListeners
        NotificationCenter.default.post(name: NSNotification.Name("TeleprompterPiP_" + name), object: nil, userInfo: data)
        if let selector = NSSelectorFromString("notifyListeners:data:") as Selector?,
           self.responds(to: selector) {
            _ = self.perform(selector, with: name, with: data)
        }
    }
    
    // MARK: - TeleprompterPiPManagerDelegate
    public func pipManagerWillStart() {
        emitEvent(name: "pipWillStart", data: [:])
    }
    
    public func pipManagerDidStart() {
        emitEvent(name: "pipDidStart", data: [:])
    }
    
    public func pipManagerWillStop() {
        emitEvent(name: "pipWillStop", data: [:])
    }
    
    public func pipManagerDidStop(finalPosition: Double) {
        emitEvent(name: "pipDidStop", data: ["position": finalPosition])
    }
    
    public func pipManagerFailed(with error: String) {
        emitEvent(name: "pipFailed", data: ["error": error])
    }
    
    public func pipManagerDidPause() {
        emitEvent(name: "pipPaused", data: [:])
    }
    
    public func pipManagerDidResume() {
        emitEvent(name: "pipResumed", data: [:])
    }
    
    public func pipManagerPositionChanged(position: Double) {
        emitEvent(name: "pipPositionUpdate", data: ["position": position])
    }
}
