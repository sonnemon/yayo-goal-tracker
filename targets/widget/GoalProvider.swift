import AppIntents
import WidgetKit

struct GoalEntry: TimelineEntry {
  let date: Date
  let goals: [Goal]
  let selectedGoal: Goal?
}

struct GoalProvider: AppIntentTimelineProvider {
  typealias Intent = SelectGoalIntent
  typealias Entry = GoalEntry

  func placeholder(in context: Context) -> GoalEntry {
    GoalEntry(date: Date(), goals: sampleGoals, selectedGoal: sampleGoals.first)
  }

  func snapshot(for configuration: SelectGoalIntent, in context: Context) async -> GoalEntry {
    let allGoals = loadGoals()
    let selected =
      allGoals.first(where: { $0.id == configuration.goal?.id }) ?? allGoals.first
    return GoalEntry(date: Date(), goals: allGoals, selectedGoal: selected)
  }

  func timeline(for configuration: SelectGoalIntent, in context: Context) async -> Timeline<GoalEntry> {
    let allGoals = loadGoals()
    let selected =
      allGoals.first(where: { $0.id == configuration.goal?.id }) ?? allGoals.first
    let entry = GoalEntry(date: Date(), goals: allGoals, selectedGoal: selected)
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
    return Timeline(entries: [entry], policy: .after(next))
  }
}
