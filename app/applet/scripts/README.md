# Odoo Automated Onboarding Script

This directory contains a custom Python script designed to interact with your Odoo server via XML-RPC. It automatically provisions the 3 requested companies and user prototypes, and configures the Platform Owner account with multi-company access.

## Prerequisites

This script runs on your Ubuntu server where Odoo is hosted (or any machine that has network access to your Odoo instance).

1. Ensure Python 3 is installed on your Ubuntu server:
   ```bash
   sudo apt update
   sudo apt install python3
   ```

## How to Execute the Script

1. **Transfer the Script to your Server**:
   Copy the `odoo_onboarding.py` file to your Ubuntu server. You can use SCP, SFTP, or simply create the file on the server and copy-paste the contents.

2. **Make the Script Executable**:
   ```bash
   chmod +x odoo_onboarding.py
   ```

3. **Run the Script**:
   Execute the script using Python. You will need to provide your Odoo Database name and your master Administrator login. The script will securely prompt you for the password.
   
   ```bash
   ./odoo_onboarding.py --db your_database_name --user admin
   ```
   *(If your Odoo is hosted on a different URL/Port, add `--url http://your-odoo-url:8069`)*

## What the Script Does

1. **Authenticates** securely using XML-RPC.
2. **Creates 3 Companies**: "Sport Academy", "Freight Forwarder", and "Talent Scout".
3. **Provisions 3 Clients**:
   - Mr. Herri Somantri (`SportAcademy@odoo.airiv.id`)
   - Mr. Satoshi Nakamoto (`FreightForwarder@odoo.airiv.id`)
   - Mr. Adjie Madjid (`TalentScout@odoo.airiv.id`)
   *(Each client is bound exclusively to their respective company and granted Administrator rights).*
4. **Provisions the Platform Owner**:
   - Creates or updates `arivonto@gmail.com`.
   - Grants multi-company access (ability to switch between all 3 client companies and the main company).
   - Assigns Super Admin rights.

## Enabling Google SSO (Action Required)

The script provisions your account (`arivonto@gmail.com`), but Odoo handles Google SSO via OAuth natively. To finalize the SSO:

1. Log into your Odoo instance using the UI as the master Administrator.
2. Navigate to **Settings** > **General Settings** > **Integrations**.
3. Enable **OAuth Authentication**.
4. Configure the Google OAuth provider by entering your **Client ID** (obtained from the Google Cloud Console).
5. Once configured, you will see a "Log in with Google" button on the Odoo login screen. Clicking it with `arivonto@gmail.com` will immediately authenticate you into the Platform Owner account with full visibility over all clients.
