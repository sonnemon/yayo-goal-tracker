import AppIntents
import WidgetKit

struct GoalEntity: AppEntity {
  let id: String
  let name: String

  static var typeDisplayRepresentation: TypeDisplayRepresentation = "Goal"
  static var defaultQuery = GoalQuery()

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(name)")
  }
}

struct GoalQuery: EntityQuery {
  func entities(for identifiers: [String]) async throws -> [GoalEntity] {
    loadGoals()
      .filter { identifiers.contains($0.id) }
      .map { GoalEntity(id: $0.id, name: $0.name) }
  }

  func suggestedEntities() async throws -> [GoalEntity] {
    loadGoals().map { GoalEntity(id: $0.id, name: $0.name) }
  }

  func defaultResult() async -> GoalEntity? {
    loadGoals().first.map { GoalEntity(id: $0.id, name: $0.name) }
  }
}

struct SelectGoalIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Select Goal"
  static var description = IntentDescription("Pick a goal to display in the widget.")

  @Parameter(title: "Goal")
  var goal: GoalEntity?
}
