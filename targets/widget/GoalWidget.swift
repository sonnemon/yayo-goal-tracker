import SwiftUI
import WidgetKit

@main
struct GoalWidgetBundle: WidgetBundle {
  var body: some Widget {
    GoalWidget()
  }
}

struct GoalWidget: Widget {
  let kind: String = "GoalWidget"

  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: kind,
      intent: SelectGoalIntent.self,
      provider: GoalProvider()
    ) { entry in
      GoalWidgetEntryView(entry: entry)
        .containerBackground(.background, for: .widget)
    }
    .configurationDisplayName("Goals")
    .description("See your goal progress at a glance.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}
