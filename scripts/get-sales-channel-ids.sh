#!/bin/bash
# Helper script to get Shopware 6 sales channel IDs for .sw-db-sync-config.json

echo "==================================="
echo "Shopware 6 Sales Channel IDs"
echo "==================================="
echo ""

# Check if we're in a Shopware directory
if [ ! -f "bin/console" ]; then
    echo "Error: Not in a Shopware directory (bin/console not found)"
    echo "Please run this script from your Shopware project root."
    exit 1
fi

# Check if database is available
if ! php bin/console about &> /dev/null; then
    echo "Error: Cannot connect to Shopware"
    echo "Make sure your database is configured and accessible."
    exit 1
fi

echo "Sales Channels in your Shopware installation:"
echo ""

# Get sales channels
php bin/console sales-channel:list 2>/dev/null || {
    # Fallback: query database directly
    php bin/console dbal:run-sql "SELECT HEX(id) as id, name, active FROM sales_channel ORDER BY name" 2>/dev/null || {
        echo "Error: Could not retrieve sales channels"
        exit 1
    }
}

echo ""
echo "==================================="
echo "Example .sw-db-sync-config.json:"
echo "==================================="
echo ""
echo '{'
echo '  "sales_channel_domains": {'
echo '    "YOUR_SALES_CHANNEL_ID_HERE": "your-domain.local",'
echo '    "ANOTHER_CHANNEL_ID": "another-domain.local"'
echo '  }'
echo '}'
echo ""
echo "Copy a sales channel ID from above and paste it into your config file."
