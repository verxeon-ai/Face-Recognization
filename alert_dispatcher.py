"""
Multi-Channel Emergency Alert Dispatcher
=========================================
Dispatches verified threat incidents to:
1. Webhooks (Microsoft Teams, Slack, Discord, Generic Webhook API)
2. Email Notifications (SMTP with HTML summary & snapshot attachment)
3. SMS Broadcast (Twilio / SMS Gateway)
4. Local Security Audit Trail (data/alerts_log.json)
"""

import os
import json
import smtplib
import requests
import threading
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from pathlib import Path

ALERTS_LOG = Path("data/alerts_log.json")


class AlertDispatcher:
    """
    Handles instantaneous dispatch of escalated threat packages across external communication rails.
    """

    def __init__(self, rules_config=None):
        self.rules_config = rules_config or {}

    def log_alert(self, alert_data):
        """Append alert to local audit trail."""
        ALERTS_LOG.parent.mkdir(parents=True, exist_ok=True)
        logs = []
        if ALERTS_LOG.exists():
            try:
                with open(ALERTS_LOG, "r", encoding="utf-8") as f:
                    logs = json.load(f)
            except Exception:
                logs = []

        logs.append(alert_data)
        logs = logs[-200:]  # Keep last 200 alerts

        try:
            with open(ALERTS_LOG, "w", encoding="utf-8") as f:
                json.dump(logs, f, indent=2)
        except Exception as e:
            print(f"[AlertDispatcher] Error saving alerts log: {e}")

    def dispatch_webhook(self, incident, webhook_url=None):
        """Send webhook notification (Slack / Teams / Discord / Generic JSON format)."""
        url = webhook_url or self.rules_config.get("webhook_url")
        if not url:
            return {"success": False, "reason": "No webhook URL configured"}

        payload = {
            "@type": "MessageCard",
            "@context": "https://schema.org/extensions",
            "themeColor": "DC3545",
            "summary": f"CRITICAL THREAT: {incident.get('threat_type')}",
            "title": f"🚨 EMERGENCY ESCALATION - {incident.get('threat_type').upper()}",
            "sections": [
                {
                    "activityTitle": f"Camera: {incident.get('camera_id', 'Main Cam')}",
                    "activitySubtitle": f"Timestamp: {incident.get('timestamp')}",
                    "facts": [
                        {"name": "Threat Level:", "value": f"Confidence {incident.get('confidence', 90)}%"},
                        {"name": "Location:", "value": incident.get("location", "Campus Safety Perimeter")},
                        {"name": "Incident ID:", "value": incident.get("incident_id", "N/A")},
                        {"name": "Status:", "value": incident.get("status", "VERIFIED & ESCALATED")},
                        {"name": "Operator Notes:", "value": incident.get("verifier_notes", "Immediate response required")}
                    ],
                    "markdown": True
                }
            ],
            # Standard payload fallback for Slack / Discord / generic API
            "text": f"🚨 *CRITICAL THREAT ESCALATION*\n*Threat:* {incident.get('threat_type')}\n*Location:* {incident.get('location')} ({incident.get('camera_id')})\n*Confidence:* {incident.get('confidence')}%\n*Time:* {incident.get('timestamp')}\n*ID:* {incident.get('incident_id')}"
        }

        try:
            resp = requests.post(url, json=payload, timeout=5)
            print(f"[AlertDispatcher] Webhook delivered with status {resp.status_code}")
            return {"success": resp.status_code in [200, 201, 204], "status_code": resp.status_code}
        except Exception as e:
            print(f"[AlertDispatcher] Webhook error: {e}")
            return {"success": False, "error": str(e)}

    def dispatch_email(self, incident, snapshot_path=None):
        """Send HTML email notification via SMTP."""
        smtp_enabled = self.rules_config.get("smtp_enabled", False)
        if not smtp_enabled:
            return {"success": False, "reason": "SMTP disabled"}

        host = self.rules_config.get("smtp_host", "smtp.gmail.com")
        port = int(self.rules_config.get("smtp_port", 587))
        user = self.rules_config.get("smtp_user", "")
        password = self.rules_config.get("smtp_password", "")
        recipient = self.rules_config.get("alert_email_recipient", "")

        if not (user and password and recipient):
            return {"success": False, "reason": "Incomplete SMTP credentials"}

        msg = MIMEMultipart("related")
        msg["Subject"] = f"🚨 URGENT: {incident.get('threat_type')} Alert - {incident.get('camera_id')}"
        msg["From"] = user
        msg["To"] = recipient

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #0d1117; color: #ffffff; padding: 20px;">
            <div style="background-color: #1a1d2e; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ff6b6b; margin-top: 0;">🚨 CRITICAL SECURITY THREAT DETECTED</h2>
                <hr style="border: 0; border-top: 1px solid #3d3b65;">
                <table style="width: 100%; color: #e1e4e8; line-height: 1.8;">
                    <tr><td><strong>Threat Type:</strong></td><td style="color: #ff6b6b; font-weight: bold;">{incident.get('threat_type')}</td></tr>
                    <tr><td><strong>Confidence:</strong></td><td>{incident.get('confidence')}%</td></tr>
                    <tr><td><strong>Camera ID:</strong></td><td>{incident.get('camera_id')}</td></tr>
                    <tr><td><strong>Location:</strong></td><td>{incident.get('location')}</td></tr>
                    <tr><td><strong>Timestamp:</strong></td><td>{incident.get('timestamp')}</td></tr>
                    <tr><td><strong>Incident ID:</strong></td><td>{incident.get('incident_id')}</td></tr>
                    <tr><td><strong>Status:</strong></td><td style="color: #f39c12;">{incident.get('status')}</td></tr>
                    <tr><td><strong>Operator Notes:</strong></td><td>{incident.get('verifier_notes', 'N/A')}</td></tr>
                </table>
                <p style="margin-top: 20px; font-size: 13px; color: #8b949e;">
                    This is an automated emergency security alert from the AI Video Threat Recognition Platform.
                </p>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_body, "html"))

        # Attach snapshot image if present
        if snapshot_path and os.path.exists(snapshot_path):
            try:
                with open(snapshot_path, "rb") as f:
                    img = MIMEImage(f.read())
                    img.add_header('Content-Disposition', 'attachment', filename=f"{incident.get('incident_id')}.jpg")
                    msg.attach(img)
            except Exception as e:
                print(f"[AlertDispatcher] Could not attach image: {e}")

        try:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.starttls()
                server.login(user, password)
                server.send_message(msg)
            print(f"[AlertDispatcher] Alert email successfully sent to {recipient}")
            return {"success": True}
        except Exception as e:
            print(f"[AlertDispatcher] SMTP Send error: {e}")
            return {"success": False, "error": str(e)}

    def dispatch_sms(self, incident):
        """Send SMS notification via Twilio or SMS gateway."""
        sms_enabled = self.rules_config.get("sms_enabled", False)
        if not sms_enabled:
            return {"success": False, "reason": "SMS disabled"}

        sid = self.rules_config.get("twilio_sid", "")
        token = self.rules_config.get("twilio_token", "")
        from_num = self.rules_config.get("twilio_from", "")
        to_num = self.rules_config.get("alert_sms_recipient", "")

        if not (sid and token and from_num and to_num):
            print("[AlertDispatcher] Twilio SMS credentials incomplete. Logging simulation.")
            return {"success": False, "reason": "Incomplete SMS credentials"}

        sms_body = f"🚨 URGENT THREAT: {incident.get('threat_type')} ({incident.get('confidence')}%) at {incident.get('camera_id')}. Time: {incident.get('timestamp')}. Incident ID: {incident.get('incident_id')}"

        try:
            resp = requests.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                data={"From": from_num, "To": to_num, "Body": sms_body},
                auth=(sid, token),
                timeout=8
            )
            return {"success": resp.status_code in [200, 201], "status_code": resp.status_code}
        except Exception as e:
            print(f"[AlertDispatcher] SMS Dispatch error: {e}")
            return {"success": False, "error": str(e)}

    def dispatch_all(self, incident, snapshot_path=None):
        """Dispatch incident asynchronously across all configured communication channels."""
        # Log to local audit trail immediately
        audit_entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "incident_id": incident.get("incident_id"),
            "threat_type": incident.get("threat_type"),
            "camera_id": incident.get("camera_id"),
            "confidence": incident.get("confidence"),
            "status": incident.get("status", "VERIFIED & ESCALATED"),
            "notes": incident.get("verifier_notes", "")
        }
        self.log_alert(audit_entry)

        def _run_dispatch():
            # 1. Webhook
            self.dispatch_webhook(incident)
            # 2. Email
            self.dispatch_email(incident, snapshot_path)
            # 3. SMS
            self.dispatch_sms(incident)

        thread = threading.Thread(target=_run_dispatch, daemon=True)
        thread.start()
        return {"success": True, "message": "Dispatched across configured alert channels"}
