<?php
require_once __DIR__ . '/config.php';

try {
    $sql = file_get_contents(__DIR__ . '/migrations/2026_06_13_add_parent_category.sql');
    $pdo->exec($sql);
    echo "Migration applied successfully.\n";
} catch (PDOException $e) {
    echo "Error applying migration: " . $e->getMessage() . "\n";
}
?>
