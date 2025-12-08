# Adzanify - Beautiful Prayer Time Reminder

A beautiful, modern Google Chrome extension that reminds you of prayer times with authentic Adzan sounds. Designed with a premium Islamic aesthetic and accurate location-based timings.

## Key Features

- ** Auto Location Detection**: Automatically detects your city/district (e.g., "Jakarta Barat", "Bekasi") to provide accurate prayer times using the Aladhan API.
- ** Authentic Adzan Notifications**:
  - Plays full Adzan sound when prayer time arrives.
  - Special Fajr Adzan distinction.
  - Silent/Beep mode options available.
- ** 3 Beautiful Themes**:
  - **Adzanify (Default)**: Premium Islamic aesthetic with Deep Emerald & Gold.
  - **Dark Mode**: Modern and minimal for low-light environments.
  - **Light Mode**: Clean and bright interface.
- ** Multi-Language Support**:
  - Bahasa Indonesia
  - English
  - Arabic (العربية) with RTL support.
- ** Real-time Countdown**: Always know exactly how much time is left until the next prayer.
- ** Smart Startup**: Automatically filters out past prayer times when you start your computer, so you don't get spammed with old notifications.

## Installation (Developer Mode)

Since this extension is currently in development/source code form, you can install it manually:

1.  **Clone or Download** this repository to your computer.
2.  Open Google Chrome and go to `chrome://extensions/`.
3.  Enable **Developer mode** (toggle in the top-right corner).
4.  Click **Load unpacked**.
5.  Select the folder where you cloned this repository (the folder containing `manifest.json`).
6.  The extension is now installed! Pin it to your toolbar for easy access.

## User Interface

Simple, clean, and focused on what matters most—your prayer times.

## Tech Stack

- **Frontend**: HTML5, CSS3 (Variables for theming), Vanilla JavaScript
- **API**: [Aladhan API](https://aladhan.com/prayer-times-api) for prayer timings
- **Geolocation**: OpenStreetMap Nominatim API for reverse geocoding (finding city names)
- **Chrome APIs**: Alarms, Notifications, Storage, Offscreen Documents (for audio)

## Customization

Click the **Settings (Gear)** icon to:

- Change **Theme** (Adzanify, Dark, Light)
- Change **Language** (Indonesian, English, Arabic)
- Change **Notification Sound** (Adhan, Beep, Silent)
- Preview notification sounds

## License

This project is open source. Feel free to contribute or modify for personal use.

-Diaz Djuliansyah
