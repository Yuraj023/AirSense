#  AirSense — Smart Air Quality Monitoring System

> A real-time, IoT-based air quality monitoring and alert system built with ESP32 and cloud integration.

---

##  Overview

Air pollution is a growing concern, especially in urban environments. **AirSense** is a compact, low-cost IoT solution that monitors harmful gases, particulate matter, temperature, and humidity in real time — and automatically sends alerts when air quality drops below safe thresholds.

This project bridges the physical and digital worlds: sensor data collected from the environment is processed, streamed to the cloud, and surfaced on a live dashboard — with instant email notifications for dangerous conditions.

---

##  Live Dashboard

> _Dashboard screenshot or GIF here_

---

##  Features

| Feature | Description |
|---|---|
|  Real-time Monitoring | Tracks gases, temperature, humidity, and PM2.5 continuously |
|  Threshold Alerts | Sends instant email notifications when air quality is unsafe |
|  Cloud Integration | Streams live sensor data to a cloud platform |
|  Live Dashboard | Visualizes all environmental data in real time |
|  Energy Efficient | Battery-powered with step-down voltage regulation |

---

##  Tech Stack

### Hardware
| Component | Purpose |
|---|---|
| **ESP32** | WiFi-enabled microcontroller (brain of the system) |
| **MQ-135** | Air quality & harmful gas detection |
| **DHT11** | Temperature & humidity sensing |
| **GP2Y1010AU0F** | PM2.5 fine particulate matter detection |
| **LMS Step-Down Module** | Stable power supply for battery operation |

### Software & Cloud
- **Cloud Platform** — Adafruit IO (real-time data streaming & dashboard)
- **Email Alerts** — Sendinblue / SMTP-based notification system
- **Dashboard** — Real-time web dashboard (React / MERN Stack)
- **Firmware** — ESP32 Arduino / MicroPython

---

##  Project Structure

```
airsense-dashboard/
├── src/                  # Frontend dashboard source
├── public/               # Static assets
├── server/               # Backend API (Node.js/Express)
├── ADAFRUIT_SETUP.md     # Adafruit IO setup guide
├── .env.example          # Environment variable template
└── README.md
```

---

##  Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn
- Adafruit IO account
- Sendinblue account (for email alerts)

### 1. Clone the Repository
```bash
git clone https://github.com/Yuraj023/AirSense.git
cd AirSense/airesense-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:
```env
ADAFRUIT_IO_USERNAME=your_username
ADAFRUIT_IO_KEY=your_key_here
SENDINBLUE_API_KEY=your_api_key_here
```

### 4. Run the Dashboard
```bash
npm start
```

---

## 🔌 Hardware Setup

1. Connect **MQ-135** to ESP32 analog pin
2. Connect **DHT11** to a digital GPIO pin
3. Connect **GP2Y1010AU0F** as per its datasheet (analog out + LED drive pin)
4. Power the circuit using the **LMS step-down module** from a battery pack
5. Flash the ESP32 firmware and configure your WiFi + Adafruit IO credentials

> Refer to `ADAFRUIT_SETUP.md` for detailed Adafruit IO configuration steps.

---

## 📡 How It Works

```
[Sensors] → [ESP32] → [Adafruit IO Cloud] → [Dashboard]
                                ↓
                        [Alert Engine]
                                ↓
                      [Email Notification]
```

1. Sensors collect environmental data every few seconds
2. ESP32 processes and publishes data to Adafruit IO feeds
3. Dashboard fetches and visualizes the live data
4. If any reading crosses a safe threshold, an email alert is triggered automatically

---

##  Monitored Parameters

| Parameter | Sensor | Safe Range |
|---|---|---|
| Air Quality Index | MQ-135 | < 100 AQI |
| PM2.5 | GP2Y1010AU0F | < 35 µg/m³ |
| Temperature | DHT11 | 18°C – 35°C |
| Humidity | DHT11 | 30% – 60% |

---

##  Roadmap

- [x] Real-time sensor data streaming
- [x] Email alert system
- [x] Cloud-connected dashboard
- [ ] Machine Learning — AQI forecasting model
- [ ] Mobile app integration
- [ ] Multi-node sensor network support
- [ ] Optimized power consumption (deep sleep mode)

---

##  What I Learned

- Integrating hardware sensors with cloud platforms end-to-end
- Handling and processing real-time IoT data streams
- Building condition-based alert automation systems
- Full IoT system design: **Device → Cloud → User**

---

##  Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

> _"Turning raw sensor data into actionable environmental insights."_
