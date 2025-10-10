-- SQL script to create Active Directory Configuration table for MySQL

CREATE TABLE IF NOT EXISTS `ActiveDirectoryConfigurations` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Enabled` BOOLEAN NOT NULL DEFAULT FALSE,
    `Domain` VARCHAR(255) NOT NULL,
    `ServerUrl` VARCHAR(255) NOT NULL,
    `BaseDN` VARCHAR(255) NOT NULL,
    `BindUsername` VARCHAR(255) NOT NULL,
    `BindPassword` VARCHAR(255) NOT NULL,
    `UseSSL` BOOLEAN NOT NULL DEFAULT FALSE,
    `Office365Integration` BOOLEAN NOT NULL DEFAULT FALSE,
    `TenantId` VARCHAR(255) NULL,
    `ClientId` VARCHAR(255) NULL,
    `ClientSecret` VARCHAR(255) NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Optional: Insert a default disabled configuration if the table is empty
INSERT IGNORE INTO `ActiveDirectoryConfigurations` (`Id`, `Enabled`, `Domain`, `ServerUrl`, `BaseDN`, `BindUsername`, `BindPassword`, `UseSSL`, `Office365Integration`)
VALUES (1, FALSE, 
        'yourdomain.com', 
        'ldap.yourdomain.com', 
        'DC=yourdomain,DC=com', 
        'binduser@yourdomain.com', 
        'your_bind_password', 
        TRUE, 
        FALSE);
