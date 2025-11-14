# Telegram Mini Apps Events Reference

## Event Registration

```javascript
tg.onEvent('eventName', handler)
tg.offEvent('eventName', handler)
```

## Lifecycle Events

### Activation

```javascript
tg.onEvent('activated', () => {
  console.log('Mini App activated');
});

tg.onEvent('deactivated', () => {
  console.log('Mini App deactivated');
});
```

## Display Events

### Viewport Changes

```javascript
tg.onEvent('viewportChanged', (event) => {
  console.log('Viewport changed');
  console.log('Height:', tg.viewportHeight);
  console.log('Stable height:', tg.viewportStableHeight);
  console.log('Is stable:', event.isStateStable);
});
```

### Safe Area (Bot API 8.0+)

```javascript
tg.onEvent('safeAreaChanged', () => {
  console.log('Safe area:', tg.safeAreaInset);
});

tg.onEvent('contentSafeAreaChanged', () => {
  console.log('Content safe area:', tg.contentSafeAreaInset);
});
```

### Fullscreen (Bot API 8.0+)

```javascript
tg.onEvent('fullscreenChanged', () => {
  console.log('Fullscreen:', tg.isFullscreen);
});

tg.onEvent('fullscreenFailed', (event) => {
  console.log('Fullscreen error:', event.error);
});
```

## Theme Events

```javascript
tg.onEvent('themeChanged', () => {
  console.log('Color scheme:', tg.colorScheme);
  console.log('Theme params:', tg.themeParams);
});
```

## Button Events

```javascript
tg.onEvent('mainButtonClicked', () => {
  console.log('Main button clicked');
});

tg.onEvent('backButtonClicked', () => {
  console.log('Back button clicked');
});

tg.onEvent('secondaryButtonClicked', () => {
  console.log('Secondary button clicked');
});

tg.onEvent('settingsButtonClicked', () => {
  console.log('Settings button clicked');
});
```

## User Interaction Events

### Dialogs

```javascript
tg.onEvent('popupClosed', (event) => {
  console.log('Button ID:', event.button_id);
});

tg.onEvent('invoiceClosed', (event) => {
  console.log('Status:', event.status);
  console.log('URL:', event.url);
});
```

### QR Code (Bot API 6.4+)

```javascript
tg.onEvent('qrTextReceived', (event) => {
  console.log('QR data:', event.data);
});

tg.onEvent('scanQrPopupClosed', () => {
  console.log('Scanner closed');
});
```

### Clipboard (Bot API 6.4+)

```javascript
tg.onEvent('clipboardTextReceived', (event) => {
  console.log('Clipboard text:', event.data);
});
```

## Permission Events

```javascript
tg.onEvent('writeAccessRequested', (event) => {
  console.log('Status:', event.status); // 'allowed' or 'cancelled'
});

tg.onEvent('contactRequested', (event) => {
  console.log('Status:', event.status); // 'sent' or 'cancelled'
});
```

## Sensor Events (Bot API 8.0+)

### Accelerometer

```javascript
tg.onEvent('accelerometerStarted', () => {});
tg.onEvent('accelerometerStopped', () => {});
tg.onEvent('accelerometerChanged', () => {});
tg.onEvent('accelerometerFailed', (event) => {
  console.log('Error:', event.error);
});
```

### Device Orientation

```javascript
tg.onEvent('deviceOrientationStarted', () => {});
tg.onEvent('deviceOrientationStopped', () => {});
tg.onEvent('deviceOrientationChanged', () => {});
tg.onEvent('deviceOrientationFailed', (event) => {
  console.log('Error:', event.error);
});
```

### Gyroscope

```javascript
tg.onEvent('gyroscopeStarted', () => {});
tg.onEvent('gyroscopeStopped', () => {});
tg.onEvent('gyroscopeChanged', () => {});
tg.onEvent('gyroscopeFailed', (event) => {
  console.log('Error:', event.error);
});
```

## Location Events (Bot API 8.0+)

```javascript
tg.onEvent('locationManagerUpdated', () => {
  console.log('Location manager updated');
});

tg.onEvent('locationRequested', (event) => {
  if (event.available) {
    console.log('Location:', event.location);
  } else {
    console.log('Location not available');
  }
});
```

## Common Event Handler Pattern

```javascript
function setupEventHandlers() {
  // Store handlers for cleanup
  const handlers = {};
  
  handlers.themeChanged = () => updateTheme();
  handlers.viewportChanged = () => updateLayout();
  handlers.backButtonClicked = () => goBack();
  handlers.mainButtonClicked = () => submit();
  
  // Register handlers
  Object.entries(handlers).forEach(([event, handler]) => {
    tg.onEvent(event, handler);
  });
  
  // Cleanup function
  return () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      tg.offEvent(event, handler);
    });
  };
}

// Usage
const cleanup = setupEventHandlers();

// Cleanup when component unmounts
// cleanup();
```

## Event Listener Best Practices

1. **Remove unused listeners** - Use `offEvent` to prevent memory leaks
2. **Debounce frequent events** - ViewportChanged fires often
3. **Check feature support** - Use `isVersionAtLeast()` before relying on events
4. **Handle errors gracefully** - Sensor and location events can fail
5. **Store event state** - Track which listeners are active

## Version Compatibility

- **Core events**: Available in all versions
- **Bot API 7.0+**: Settings button, emoji status
- **Bot API 7.10+**: Secondary button, bottom bar
- **Bot API 8.0+**: Fullscreen, safe area, sensors, location
