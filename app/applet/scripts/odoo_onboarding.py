#!/usr/bin/env python3
import xmlrpc.client
import sys
import argparse
import getpass

def main():
    parser = argparse.ArgumentParser(description='Odoo Automated Client Provisioning')
    parser.add_argument('-u', '--url', default='http://localhost:8069', help='Odoo URL (e.g., http://localhost:8069)')
    parser.add_argument('-d', '--db', required=True, help='Odoo Database Name')
    parser.add_argument('-U', '--user', required=True, help='Admin Login (e.g., admin)')
    args = parser.parse_args()

    password = getpass.getpass(prompt=f'Enter password for {args.user}: ')

    print(f"\n[1/4] Connecting to Odoo at {args.url} (Database: {args.db})...")
    
    try:
        common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(args.url))
        uid = common.authenticate(args.db, args.user, password, {})
        if not uid:
            print("❌ Authentication failed. Please check your credentials.")
            sys.exit(1)
        print("✅ Authentication successful!")
        
        models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(args.url))
    except Exception as e:
        print(f"❌ Connection error: {e}")
        sys.exit(1)

    print("\n[2/4] Resolving Administrator access groups...")
    # Get the "Administration / Settings" group (Super Admin)
    group_system_data = models.execute_kw(args.db, uid, password, 'ir.model.data', 'search_read',
        [[('name', '=', 'group_system'), ('module', '=', 'base')]], {'fields': ['res_id']})
    
    if not group_system_data:
        print("❌ Could not find the Administrator group in the database.")
        sys.exit(1)
        
    admin_group_id = group_system_data[0]['res_id']

    clients = [
        {
            "name": "Mr. Herri Somantri", 
            "login": "SportAcademy@odoo.airiv.id", 
            "password": "SAClient", 
            "company": "Sport Academy"
        },
        {
            "name": "Mr. Satoshi Nakamoto", 
            "login": "FreightForwarder@odoo.airiv.id", 
            "password": "FFClient", 
            "company": "Freight Forwarder"
        },
        {
            "name": "Mr. Adjie Madjid", 
            "login": "TalentScout@odoo.airiv.id", 
            "password": "TSClient", 
            "company": "Talent Scout"
        },
    ]

    print("\n[3/4] Provisioning client companies and users...")
    company_ids = []
    
    for client in clients:
        # 1. Check if Company exists, otherwise create
        existing_comp = models.execute_kw(args.db, uid, password, 'res.company', 'search', [[('name', '=', client['company'])]])
        if existing_comp:
            comp_id = existing_comp[0]
            print(f"  ➜ Found existing Company: {client['company']} (ID: {comp_id})")
        else:
            comp_id = models.execute_kw(args.db, uid, password, 'res.company', 'create', [{
                'name': client['company']
            }])
            print(f"  ➜ Created Company: {client['company']} (ID: {comp_id})")
            
        company_ids.append(comp_id)

        # 2. Check if User exists, otherwise create
        existing_user = models.execute_kw(args.db, uid, password, 'res.users', 'search', [[('login', '=', client['login'])]])
        
        if existing_user:
            user_id = existing_user[0]
            # Update the existing user with the correct permissions and company
            models.execute_kw(args.db, uid, password, 'res.users', 'write', [[user_id], {
                'name': client['name'],
                'password': client['password'],
                'company_id': comp_id,
                'company_ids': [(6, 0, [comp_id])], # Grant access ONLY to their own company
                'groups_id': [(6, 0, [admin_group_id])], # Grant Admin Rights
                'sel_groups_1_8_9': 9 # Usually maps to internal user/admin UI configurations in Odoo
            }])
            print(f"  ➜ Updated existing User: {client['name']} ({client['login']})")
        else:
            user_id = models.execute_kw(args.db, uid, password, 'res.users', 'create', [{
                'name': client['name'],
                'login': client['login'],
                'password': client['password'],
                'company_id': comp_id,
                'company_ids': [(6, 0, [comp_id])], # Grant access ONLY to their own company
                'groups_id': [(6, 0, [admin_group_id])], # Grant Admin Rights
                'sel_groups_1_8_9': 9 # Usually maps to internal user/admin UI configurations in Odoo
            }])
            print(f"  ➜ Created User: {client['name']} ({client['login']})")

    print("\n[4/4] Provisioning Platform Owner (Super Admin)...")
    
    # Check if arivonto@gmail.com already exists
    existing_owner = models.execute_kw(args.db, uid, password, 'res.users', 'search', [[('login', '=', 'arivonto@gmail.com')]])
    
    # We want the owner to have access to ALL companies, including the default one (ID 1)
    all_companies = [1] + company_ids 

    if existing_owner:
        owner_id = existing_owner[0]
        # Update existing user to have access to the new companies
        models.execute_kw(args.db, uid, password, 'res.users', 'write', [[owner_id], {
            'company_ids': [(4, cid) for cid in company_ids], # (4, id) adds the id to the existing list
            'groups_id': [(4, admin_group_id)]
        }])
        print(f"  ➜ Updated existing Platform Owner (arivonto@gmail.com) with multi-company access.")
    else:
        owner_id = models.execute_kw(args.db, uid, password, 'res.users', 'create', [{
            'name': 'Arivonto (Platform Owner)',
            'login': 'arivonto@gmail.com',
            'company_id': 1, # Default to the main company
            'company_ids': [(6, 0, all_companies)], # Access to ALL companies
            'groups_id': [(6, 0, [admin_group_id])],
        }])
        print(f"  ➜ Created new Platform Owner (arivonto@gmail.com) with multi-company access.")

    print("\n✅ Provisioning Complete!")
    print("\n⚠️ IMPORTANT: To enable Google SSO for 'arivonto@gmail.com':")
    print("  1. Log into Odoo UI.")
    print("  2. Go to Settings -> General Settings -> Integrations.")
    print("  3. Check 'OAuth Authentication' and set up your Google OAuth Credentials.")

if __name__ == "__main__":
    main()
