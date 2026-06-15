<?php
require_once __DIR__ . '/config.php';

try {
    $migrations = glob(__DIR__ . '/migrations/*.sql');
    sort($migrations);
    foreach ($migrations as $file) {
        $sql = file_get_contents($file);
        if (trim($sql) === '') continue;
        echo "Applying migration: " . basename($file) . "\n";
        $pdo->exec($sql);
    }
    echo "Migrations applied successfully.\n";
} catch (PDOException $e) {
    echo "Error applying migration: " . $e->getMessage() . "\n";
}
?>
