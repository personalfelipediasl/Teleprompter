//
//  TeleprompterPiPModels.swift
//  Teleprompter iPhone - Native iOS PiP Models
//
//  Data structures representing teleprompter state, script payload, and styling options.
//

import Foundation

public struct TeleprompterScriptPayload {
    public let id: String
    public let title: String
    public let content: String
    public let initialPosition: Double
    public let speed: Double
    public let fontSize: Double
    public let textColor: String
    public let bgColor: String
    public let opacity: Double
    public let isPlaying: Bool
    
    public init(
        id: String,
        title: String,
        content: String,
        initialPosition: Double = 0,
        speed: Double = 1.0,
        fontSize: Double = 32.0,
        textColor: String = "#FFFFFF",
        bgColor: String = "#121318",
        opacity: Double = 1.0,
        isPlaying: Bool = true
    ) {
        self.id = id
        self.title = title
        self.content = content
        self.initialPosition = initialPosition
        self.speed = speed
        self.fontSize = fontSize
        self.textColor = textColor
        self.bgColor = bgColor
        self.opacity = opacity
        self.isPlaying = isPlaying
    }
}

public struct TeleprompterStateSnapshot {
    public let scriptId: String
    public let title: String
    public let currentPosition: Double
    public let speed: Double
    public let fontSize: Double
    public let isPlaying: Bool
    public let timestamp: Double
    
    public func toDictionary() -> [String: Any] {
        return [
            "scriptId": scriptId,
            "title": title,
            "currentPosition": currentPosition,
            "speed": speed,
            "fontSize": fontSize,
            "isPlaying": isPlaying,
            "timestamp": timestamp
        ]
    }
}
