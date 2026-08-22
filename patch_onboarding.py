import re

with open('/app/applet/scripts/odoo_onboarding.py', 'r') as f:
    content = f.read()

target = """    print("\\n[2/4] Resolving Administrator access groups...")
    # Get the "Administration / Settings" group (Super Admin)
    group_system_data = models.execute_kw(args.db, uid, password, 'ir.model.data', 'search_read',
        [[('name', '=', 'group_system'), ('module', '=', 'base')]], {'fields': ['res_id']})
    
    if not group_system_data:
        print("❌ Could not find the Administrator group in the database.")
        sys.exit(1)
        
    admin_group_id = group_system_data[0]['res_id']"""

replacement = """    print("\\n[2/4] Resolving Administrator access groups...")
    # Get the "Administration / Settings" group (Super Admin)
    group_system_data = models.execute_kw(args.db, uid, password, 'ir.model.data', 'search_read',
        [[('name', '=', 'group_system'), ('module', '=', 'base')]], {'fields': ['res_id']})
        
    # Get the "Administration / Access Rights" group (ERP Manager) required for modifying users
    group_erp_data = models.execute_kw(args.db, uid, password, 'ir.model.data', 'search_read',
        [[('name', '=', 'group_erp_manager'), ('module', '=', 'base')]], {'fields': ['res_id']})
    
    if not group_system_data or not group_erp_data:
        print("❌ Could not find the Administrator groups in the database.")
        sys.exit(1)
        
    admin_group_id = group_system_data[0]['res_id']
    erp_group_id = group_erp_data[0]['res_id']
    admin_groups = [admin_group_id, erp_group_id]"""

content = content.replace(target, replacement)

# Now replace the group assignments
content = content.replace("'groups_id': [(6, 0, [admin_group_id])]", "'groups_id': [(6, 0, admin_groups)]")
content = content.replace("'groups_id': [(4, admin_group_id)]", "'groups_id': [(4, admin_group_id), (4, erp_group_id)]")

with open('/app/applet/scripts/odoo_onboarding.py', 'w') as f:
    f.write(content)
print("Patched script.")
