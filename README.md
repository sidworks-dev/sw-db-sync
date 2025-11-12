# Database synchronization tool for Shopware 6 (Mac/Linux)
![](https://i.imgur.com/QWNjULB.png)

## Main functionality
This tool downloads clean/stripped or full Shopware 6 databases & media images over a SSH connection, imports and configures it for development purposes. Have a fully configurated production or staging environment on your local machine within minutes. Making life a little bit easier.

## Getting started
Follow the [documentation](https://github.com/sidworks-dev/sw-db-sync/wiki) and get started.

## Project-specific configuration

You can create a `.sw-db-sync-config.json` file in your Shopware project root to customize domain mapping and system configuration per project.

### Sales Channel Domain Mapping

Map specific sales channels to local domains:

```json
{
  "sales_channel_domains": {
    "018C3C4F4FA170F89E6B5F6A5C8D0E99": "my-store.local",
    "018C3C4F4FA170F89E6B5F6A5C8D0E98": "my-other-store.local"
  }
}
```

**Get your sales channel IDs:**
```bash
# From your Shopware project root:
bin/console sales-channel:list

# Or use the helper script:
bash node_modules/sw-db-sync/scripts/get-sales-channel-ids.sh
```

### System Configuration

Set system configuration values per sales channel or globally:

```json
{
  "system_config": {
    "null": {
      "core.basicInformation.email": "info@example.local",
      "core.mailerSettings.emailAgent": "local"
    },
    "018C3C4F4FA170F89E6B5F6A5C8D0E99": {
      "core.basicInformation.shopName": "My Local Store"
    }
  }
}
```

Use `"null"` or `"global"` as the key for global configurations that apply to all sales channels.

### Example Configuration

See `config/.sw-db-sync-config.json.sample` for a complete example.
