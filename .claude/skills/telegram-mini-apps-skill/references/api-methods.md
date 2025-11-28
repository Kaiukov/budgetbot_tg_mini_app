# WebApp API Methods Reference

## Control Methods

### Basic App Control

```javascript
tg.ready()                           // Signal that app is ready
tg.expand()                          // Expand to full screen
tg.close()                           // Close Mini App
tg.isVersionAtLeast('X.X')          // Check API version support
```

### Color Management

```javascript
tg.setHeaderColor('color')          // Set header color
tg.setBackgroundColor('color')      // Set background color
tg.setBottomBarColor('color')       // Set bottom bar color (Bot API 7.10+)
```

## Dialog Windows

```javascript
tg.showAlert(text, callback)                // Simple alert
tg.showConfirm(text, callback)             // Confirmation dialog
tg.showPopup(params, callback)             // Custom popup
```

## Buttons

### BackButton

```javascript
tg.BackButton.show()
tg.BackButton.hide()
tg.BackButton.isVisible
tg.BackButton.onClick(handler)
tg.BackButton.offClick(handler)
```

### MainButton

```javascript
tg.MainButton.setText(text)
tg.MainButton.show()
tg.MainButton.hide()
tg.MainButton.enable()
tg.MainButton.disable()
tg.MainButton.showProgress()
tg.MainButton.hideProgress()
tg.MainButton.setParams(params)
tg.MainButton.onClick(handler)
```

### SecondaryButton (Bot API 7.10+)

```javascript
tg.SecondaryButton.setText(text)
tg.SecondaryButton.show()
tg.SecondaryButton.hide()
tg.SecondaryButton.onClick(handler)
```

### SettingsButton

```javascript
tg.SettingsButton.show()
tg.SettingsButton.hide()
tg.SettingsButton.onClick(handler)
```

## Storage

### CloudStorage

```javascript
tg.CloudStorage.setItem(key, value, callback)
tg.CloudStorage.getItem(key, callback)
tg.CloudStorage.getItems(keys, callback)
tg.CloudStorage.getKeys(callback)
tg.CloudStorage.removeItem(key, callback)
tg.CloudStorage.removeItems(keys, callback)
```

### DeviceStorage (Bot API 9.0+)

```javascript
tg.DeviceStorage.setItem(key, value, callback)
tg.DeviceStorage.getItem(key, callback)
```

### SecureStorage (Bot API 9.0+)

```javascript
tg.SecureStorage.setItem(key, value, callback)
tg.SecureStorage.getItem(key, callback)
tg.SecureStorage.clear(callback)
```

## Haptic Feedback

```javascript
tg.HapticFeedback.impactOccurred('light')      // light, medium, heavy, rigid, soft
tg.HapticFeedback.notificationOccurred('success')  // success, error, warning
tg.HapticFeedback.selectionChanged()
```

## Advanced Features

### Biometric (Bot API 7.2+)

```javascript
tg.BiometricManager.init(callback)
tg.BiometricManager.requestAccess(options, callback)
tg.BiometricManager.authenticate(options, callback)
```

### Location (Bot API 8.0+)

```javascript
tg.LocationManager.init(callback)
tg.LocationManager.getLocation(callback)
```

### Screen Control (Bot API 8.0+)

```javascript
tg.requestFullscreen(callback)
tg.exitFullscreen()
tg.lockOrientation()
tg.unlockOrientation()
tg.enableVerticalSwipes()
tg.disableVerticalSwipes()
```

### Keyboard (Bot API 8.0+)

```javascript
tg.hideKeyboard()
```

## Link Management

```javascript
tg.openLink(url, options)
tg.openTelegramLink(url)
tg.switchInlineQuery(query, types)
```

## QR and Clipboard (Bot API 6.4+)

```javascript
tg.showScanQrPopup(options, callback)
tg.closeScanQrPopup()
tg.readTextFromClipboard(callback)
```

## Permissions

```javascript
tg.requestWriteAccess(callback)
tg.requestContact(callback)
tg.requestEmojiStatusAccess()
```

## File Operations (Bot API 8.0+)

```javascript
tg.downloadFile({ url, file_name })
tg.shareMessage({ type, media_url, text })
```

## Shortcut Management (Bot API 8.0+)

```javascript
tg.addToHomeScreen(callback)
tg.checkHomeScreenStatus(callback)
```
