#!/bin/bash
# Post-install hook to fix CocoaPods script sandbox issue
cd "$(dirname "$0")/ios/App"
sed -i '' 's|shellScript = "\\"${PODS_ROOT}/Target Support Files/Pods-App/Pods-App-frameworks.sh\\"\\n";|shellScript = "cat \\"${PODS_ROOT}/Target Support Files/Pods-App/Pods-App-frameworks.sh\\" | sh\\n";|g' App.xcodeproj/project.pbxproj
