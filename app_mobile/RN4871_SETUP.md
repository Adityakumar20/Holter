# 📟 RN4871 Configuration Guide

To work with our **Wireless Holter Dashboard**, the RN4871 must be configured in **Transparent UART** mode at **115200 baud**.

Connect the RN4871 to a USB-to-TTL adapter (or via the STM32 using a Serial Passthrough sketch) and send these commands in a Serial Monitor:

## 1. Enter Command Mode
Type: `$$$` (No newline/Enter)
Response: `CMD>`

## 2. Set Device Name
Command: `S-,HolterPro`
Response: `AOK`

## 3. Set Baud Rate (115200)
Command: `SB,4`
Wait, for RN4871:
`SB,0` = 9600
`SB,1` = 19200
`SB,2` = 38400
`SB,3` = 57600
`SB,4` = 115200
Command: `SB,4`
Response: `AOK`

## 4. Enable Transparent UART
Command: `SS,C0` (Sets Device Information and Transparent UART services)
Response: `AOK`

## 5. Enable Support for Large MTU (Optional but better)
Command: `SR,0100`
Response: `AOK`

## 6. Reboot to Apply
Command: `R,1`
Response: `Rebooting`

---

## 🔍 Matching UUIDs
We are using the **Transparent UART Service**. If you need to verify them, they are:
- **Service UUID**: `49535452-6564-6c6f-6261-6c5365727669`
- **Write Characteristic**: `49535452-6564-6c6f-6261-6c536572766b`
- **Notify/Read Characteristic**: `49535452-6564-6c6f-6261-6c536572766a`

**Once configured, your Mobile Phone will detect the device as "HolterPro"!**
