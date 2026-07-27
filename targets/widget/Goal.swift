import Foundation

struct Goal: Codable, Identifiable {
  let id: String
  let name: String
  let progress: Double
  let total: Double
  let start: Double?
  let unit: String
  let icon: String

  var startValue: Double { start ?? 0 }
  var isDecreasing: Bool { total < startValue }

  // 0..1 fraction of progress along the start→total range, direction-aware.
  var progressFraction: Double {
    let range = abs(total - startValue)
    guard range > 0 else { return 0 }
    let moved = isDecreasing ? (startValue - progress) : (progress - startValue)
    return max(0, min(1, moved / range))
  }
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
  Goal(id: "1", name: "Save for Japan trip", progress: 1850, total: 5000, start: 0, unit: "$", icon: "wallet"),
  Goal(id: "2", name: "Daily steps", progress: 7840, total: 10000, start: 0, unit: "steps", icon: "footprints"),
  Goal(id: "3", name: "Books read this year", progress: 14, total: 30, start: 0, unit: "books", icon: "book"),
  Goal(id: "4", name: "Workout sessions", progress: 12, total: 20, start: 0, unit: "", icon: "dumbbell"),
]

func formatRange(goal: Goal) -> String {
  let fmt = NumberFormatter()
  fmt.numberStyle = .decimal
  fmt.maximumFractionDigits = 2
  let p = fmt.string(from: NSNumber(value: goal.progress)) ?? "0"
  let t = fmt.string(from: NSNumber(value: goal.total)) ?? "0"
  let sep = goal.isDecreasing ? " ↓ " : "/"
  let unit = goal.unit
  if unit.isEmpty { return "\(p)\(sep)\(t)" }
  if unit == "%" { return "\(p)\(sep)\(t)\(unit)" }
  return "\(p)\(sep)\(t) \(unit)"
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
