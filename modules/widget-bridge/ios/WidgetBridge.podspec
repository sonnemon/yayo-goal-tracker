require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'WidgetBridge'
  s.version        = package['version']
  s.summary        = 'Sync goals to widget App Group storage and reload widgets'
  s.description    = 'Sync goals to widget App Group storage and reload widgets'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.license        = 'MIT'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
