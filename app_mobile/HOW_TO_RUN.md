# 📱 How to Run on Mobile

Since the dashboard uses **Web Bluetooth**, mobile browsers require it to be served over a **Secure Connection (HTTPS)** or **Localhost**. 

Follow these steps to get it running on your phone:

## Option 1: Using your PC as a Server (Easiest)

1.  **Start a Local Server**:
    Open a terminal in this folder and run:
    ```bash
    python -m http.server 8000
    ```
2.  **Find your PC's IP Address**:
    - Open CMD and type `ipconfig`.
    - Look for `IPv4 Address` (e.g., `192.168.1.15`).
3.  **Open on Phone**:
    - Connect your phone to the **same Wi-Fi** as your PC.
    - Open Chrome on your phone and go to: `http://192.168.1.15:8000` (replace with your IP).

### ⚠️ IMPORTANT: Enable Bluetooth Permissions
Because you are using an IP address (not HTTPS), Chrome will block Bluetooth by default.
1. In Mobile Chrome, go to: `chrome://flags/#enable-web-bluetooth-new-permissions-backend`
2. Set it to **Enabled**.
3. Also go to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
4. In the text box, type your PC's address: `http://192.168.1.15:8000`
5. Enable the flag and **Relaunch Chrome**.

---

## Option 2: Using GitHub Pages (Best Experience)

Kyunki aapne **Holter** repository bana li hai, ab bas ye commands apne PC ke terminal mein `app_mobile` folder ke andar chalayein:

1.  **Initialize & Upload**:
    ```bash
    git init
    git add .
    git commit -m "Initial BLE App"
    git branch -M main
    git remote add origin https://github.com/Adityakumar20/Holter.git
    git push -u origin main
    ```

2.  **Activate Hosting**:
    - GitHub par apne **Holter** repo mein jaayein.
    - **Settings** (top menu) > **Pages** (left sidebar) par click karein.
    - "Build and deployment" section mein **Branch** ko `main` select karke **Save** karein.
    - 1 minute baad aapko ek link milega (e.g., `https://adityakumar20.github.io/Holter/`).

3.  **Run on Phone**:
    - Us link ko apne phone par kholein.
    - Bluetooth on karein aur **CONNECT DEVICE** dabayein. **HTTPS hone ki wajah se ye extra settings ke bina chalega!**

## 🌐 Supported Browsers
- **Android**: Google Chrome (Best), Bluefy.
- **iOS (iPhone)**: Must use the **Bluefy** or **WebBLE** app from the App Store (Safari does not support Web Bluetooth).
