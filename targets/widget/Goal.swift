import Foundation

struct Goal: Codable, Identifiable {
  let id: String
  let name: String
  let progress: Double
  let total: Double
  let unit: String
  let icon: String
}

struct GoalsPayload: Codable {
  let goals: [Goal]
}

let APP_GROUP = "group.com.carloshuarcaya.goaltracker"
let GOALS_KEY = "goals"

func loadGoals() -> [Goal] {
  guard
    let defaults = UserDefaults(suiteName: APP_GROUP),
    let json = defaults.string(forKey: GOALS_KEY),
    let data = json.data(using: .utf8),
    let payload = try? JSONDecoder().decode(GoalsPayload.self, from: data)
  else { return sampleGoals }
  return payload.goals
}

let sampleGoals: [Goal] = [
  Goal(id: "1", name: "Save for Japan trip", progress: 1850, total: 5000, unit: "$", icon: "wallet"),
  Goal(id: "2", name: "Daily steps", progress: 7840, total: 10000, unit: "steps", icon: "footprints"),
  Goal(id: "3", name: "Books read this year", progress: 14, total: 30, unit: "books", icon: "book"),
  Goal(id: "4", name: "Workout sessions", progress: 12, total: 20, unit: "", icon: "dumbbell"),
]

func formatRange(progress: Double, total: Double, unit: String) -> String {
  let fmt = NumberFormatter()
  fmt.numberStyle = .decimal
  fmt.maximumFractionDigits = 2
  let p = fmt.string(from: NSNumber(value: progress)) ?? "0"
  let t = fmt.string(from: NSNumber(value: total)) ?? "0"
  if unit.isEmpty { return "\(p)/\(t)" }
  if unit == "%" { return "\(p)/\(t)\(unit)" }
  return "\(p)/\(t) \(unit)"
}

func sfSymbol(for icon: String) -> String {
  switch icon {
    case "wallet":      return "wallet.pass"
    case "dollar-sign": return "dollarsign.circle"
    case "footprints":  return "figure.walk"
    case "bike":        return "bicycle"
    case "book":        return "book"
    case "library":     return "books.vertical"
    case "file-text":   return "doc.text"
    case "dumbbell":    return "dumbbell"
    case "droplet":     return "drop"
    case "coffee":      return "cup.and.saucer"
    case "plane":       return "airplane"
    case "heart":       return "heart"
    case "clock":       return "clock"
    case "flame":       return "flame"
    case "leaf":        return "leaf"
    case "trophy":      return "trophy"
    default:            return "flag"
  }
}
