-- Normalize existing store settings socialLinks to the new object structure.
-- This adds or converts Facebook, Instagram, YouTube, Twitter, LinkedIn, and WhatsApp links safely.

UPDATE `settings`
SET `setting_value` = JSON_SET(
    setting_value,
    '$.socialLinks.facebook',
    JSON_OBJECT(
        'enabled', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.facebook')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.facebook.enabled'),
            IF(JSON_EXTRACT(setting_value, '$.socialLinks.facebook') IS NULL, false, true)
        ),
        'url', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.facebook')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.facebook.url'),
            JSON_UNQUOTE(JSON_EXTRACT(setting_value, '$.socialLinks.facebook'))
        )
    ),
    '$.socialLinks.instagram',
    JSON_OBJECT(
        'enabled', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.instagram')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.instagram.enabled'),
            IF(JSON_EXTRACT(setting_value, '$.socialLinks.instagram') IS NULL, false, true)
        ),
        'url', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.instagram')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.instagram.url'),
            JSON_UNQUOTE(JSON_EXTRACT(setting_value, '$.socialLinks.instagram'))
        )
    ),
    '$.socialLinks.youtube',
    JSON_OBJECT(
        'enabled', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.youtube')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.youtube.enabled'),
            IF(JSON_EXTRACT(setting_value, '$.socialLinks.youtube') IS NULL, false, true)
        ),
        'url', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.youtube')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.youtube.url'),
            JSON_UNQUOTE(JSON_EXTRACT(setting_value, '$.socialLinks.youtube'))
        )
    ),
    '$.socialLinks.twitter',
    JSON_OBJECT(
        'enabled', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.twitter')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.twitter.enabled'),
            IF(JSON_EXTRACT(setting_value, '$.socialLinks.twitter') IS NULL, false, true)
        ),
        'url', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.twitter')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.twitter.url'),
            JSON_UNQUOTE(JSON_EXTRACT(setting_value, '$.socialLinks.twitter'))
        )
    ),
    '$.socialLinks.linkedin',
    JSON_OBJECT(
        'enabled', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.linkedin')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.linkedin.enabled'),
            IF(JSON_EXTRACT(setting_value, '$.socialLinks.linkedin') IS NULL, false, true)
        ),
        'url', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.linkedin')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.linkedin.url'),
            JSON_UNQUOTE(JSON_EXTRACT(setting_value, '$.socialLinks.linkedin'))
        )
    ),
    '$.socialLinks.whatsapp',
    JSON_OBJECT(
        'enabled', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.whatsapp')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.whatsapp.enabled'),
            IF(JSON_EXTRACT(setting_value, '$.socialLinks.whatsapp') IS NULL, false, true)
        ),
        'url', IF(JSON_TYPE(JSON_EXTRACT(setting_value, '$.socialLinks.whatsapp')) = 'OBJECT',
            JSON_EXTRACT(setting_value, '$.socialLinks.whatsapp.url'),
            JSON_UNQUOTE(JSON_EXTRACT(setting_value, '$.socialLinks.whatsapp'))
        )
    )
)
WHERE setting_key = 'store_settings';
