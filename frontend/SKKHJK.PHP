<?php
include('include/config.php');
// Start session
session_start();

// Language support
if (isset($_GET['lang'])) {
    $lang = $_GET['lang'];
    if (in_array($lang, ['en', 'am'])) {
        $_SESSION['lang'] = $lang;
    }
}

if (!isset($_SESSION['lang'])) {
    $_SESSION['lang'] = 'en'; // default English
}

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    header("Location: login.php");
    exit();
}

// Function to get counts for dashboard
function getCounts($conn) {
    $counts = [];
    
    // Total farmers
    $result = $conn->query("SELECT COUNT(*) AS total FROM farmers where status='approved'");
    $counts['total_farmers'] = $result->fetch_assoc()['total'];
    
    // Total sellers
    $result = $conn->query("SELECT COUNT(*) AS total FROM sellers where status='approved'");
    $counts['total_sellers'] = $result->fetch_assoc()['total'];
    
    // Pending approvals
    $result = $conn->query("SELECT COUNT(*) AS total FROM farmers WHERE status='pending'");
    $farmers_pending = $result->fetch_assoc()['total'];
    
    $result = $conn->query("SELECT COUNT(*) AS total FROM sellers WHERE status='pending'");
    $sellers_pending = $result->fetch_assoc()['total'];
    $counts['pending_approvals'] = $farmers_pending + $sellers_pending;
    
    // Pending products
    $result = $conn->query("SELECT COUNT(*) AS total FROM products WHERE status='approved'");
    $counts['pending_products'] = $result->fetch_assoc()['total'];
    
    // Total products
    $result = $conn->query("SELECT COUNT(*) AS total FROM products");
    $counts['total_products'] = $result->fetch_assoc()['total'];
    
    return $counts;
}

// Function to get pending accounts
function getPendingAccounts($conn) {
    $pending = [];
    
    // Get pending farmers
    $result = $conn->query("SELECT farmers.*, users.username 
                           FROM farmers 
                           JOIN users ON farmers.user_id = users.id 
                           WHERE farmers.status='pending'");
    while ($row = $result->fetch_assoc()) {
        $row['type'] = 'farmer';
        $pending[] = $row;
    }
    
    // Get pending sellers
    $result = $conn->query("SELECT sellers.*, users.username 
                           FROM sellers 
                           JOIN users ON sellers.user_id = users.id 
                           WHERE sellers.status='pending'");
    while ($row = $result->fetch_assoc()) {
        $row['type'] = 'seller';
        $pending[] = $row;
    }
    
    return $pending;
}

// Function to get approved farmers
function getApprovedFarmers($conn) {
    $farmers = [];
    $result = $conn->query("SELECT farmers.*, users.username, users.email 
                           FROM farmers 
                           JOIN users ON farmers.user_id = users.id 
                           WHERE farmers.status='approved'");
    while ($row = $result->fetch_assoc()) {
        $farmers[] = $row;
    }
    return $farmers;
}

// Function to get approved sellers
function getApprovedSellers($conn) {
    $sellers = [];
    $result = $conn->query("SELECT sellers.*, users.username, users.email 
                           FROM sellers 
                           JOIN users ON sellers.user_id = users.id 
                           WHERE sellers.status='approved'");
    while ($row = $result->fetch_assoc()) {
        $sellers[] = $row;
    }
    return $sellers;
}

// Function to get pending products
function getPendingProducts($conn) {
    $products = [];
    $result = $conn->query("SELECT products.*, users.username AS farmer_name 
                           FROM products 
                           JOIN farmers ON products.farmer_id = farmers.user_id 
                           JOIN users ON farmers.user_id = users.id 
                           WHERE products.status='pending'");
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    return $products;
}

// Function to get all products
function getAllProducts($conn) {
    $products = [];
    $result = $conn->query("SELECT products.*, users.username AS farmer_name 
                           FROM products 
                           JOIN farmers ON products.farmer_id = farmers.user_id 
                           JOIN users ON farmers.user_id = users.id 
                           where products.status='approved'");
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    return $products;
}

// Function to update account status
if (isset($_POST['action'])) {
    if (isset($_POST['id'])) {
        $id = $conn->real_escape_string($_POST['id']);
        $type = $conn->real_escape_string($_POST['type']);
        $action = $conn->real_escape_string($_POST['action']);
        
        if($action == 'approve')  {$status ='approved' ; }
        else if($action == 'reject'){$status ='rejected';}
        else{$status ='pending';}
        
        if ($type == 'farmer') {
            $sql = "UPDATE farmers SET status='$status' WHERE id='$id'";
        } elseif ($type == 'seller') {
            $sql = "UPDATE sellers SET status='$status' WHERE id='$id'";
        } elseif ($type == 'product') {
            $sql = "UPDATE products SET status='$status' WHERE id='$id'";
        }
        
        if ($conn->query($sql)) {
            $success = ($_SESSION['lang'] == 'am') ? 
                (ucfirst($type) . " በተሳካ ሁኔታ ተዘምኗል!") : 
                (ucfirst($type) . " updated successfully!");
        } else {
            $error = ($_SESSION['lang'] == 'am') ? 
                ("$type ማዘመን ላይ ስህተት: " . $conn->error) : 
                ("Error updating $type: " . $conn->error);
        }
    }
} 
// Get notifications
$sql = "SELECT * FROM Contact ORDER BY created_at DESC LIMIT 5";
$notifications_result = $conn->query($sql);
$unread_notifications = $conn->query("SELECT COUNT(*) as count FROM Contact WHERE is_read = 0")->fetch_assoc()['count'];

// Handle notification read status
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['mark_notification_read'])) {
    $notification_id = $conn->real_escape_string($_POST['notification_id']);
    $sql = "UPDATE Contact SET is_read = 1 WHERE id = $notification_id  ";
    $conn->query($sql);
    $unread_notifications = $conn->query("SELECT COUNT(*) as count FROM Contact WHERE  is_read = 0")->fetch_assoc()['count'];
    $notifications_result = $conn->query("SELECT * FROM Contact  ORDER BY created_at DESC LIMIT 5");
}

// Handle mark all as read
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['mark_all_read'])) {
    $sql = "UPDATE Contact SET is_read = 1";
    $conn->query($sql);
    $unread_notifications = 0;
    $notifications_result = $conn->query("SELECT * FROM Contact  ORDER BY created_at DESC LIMIT 5");
}

// Get data for dashboard
$counts = getCounts($conn);
$pendingAccounts = getPendingAccounts($conn);
$farmers = getApprovedFarmers($conn);
$sellers = getApprovedSellers($conn);
$pendingProducts = getPendingProducts($conn);
$allProducts = getAllProducts($conn);
?>

<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo ($_SESSION['lang'] == 'am') ? 'የአስተዳዳሪ ዳሽቦርድ - FarmLink Connect' : 'FarmLink Connect - Admin Dashboard'; ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            /* Light Theme */
            --primary: #10b981;
            --primary-dark: #059669;
            --primary-light: #34d399;
            --secondary: #f59e0b;
            --accent: #3b82f6;
            --dark: #1f2937;
            --light: #f9fafb;
            --gray: #6b7280;
            --gray-light: #e5e7eb;
            --gray-dark: #374151;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --bg-card: #ffffff;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --border-color: #e5e7eb;
            --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1);
            --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
            --radius: 0.75rem;
            --radius-lg: 1rem;
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            --glass: rgba(255, 255, 255, 0.1);
            --glass-border: rgba(255, 255, 255, 0.2);
            --sidebar-width: 280px;
            --sidebar-collapsed: 80px;
        }

        [data-theme="dark"] {
            /* Dark Theme */
            --primary: #34d399;
            --primary-dark: #10b981;
            --primary-light: #a7f3d0;
            --secondary: #fbbf24;
            --accent: #60a5fa;
            --dark: #0f172a;
            --light: #1e293b;
            --gray: #94a3b8;
            --gray-light: #334155;
            --gray-dark: #cbd5e1;
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --bg-card: #1e293b;
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --border-color: #334155;
            --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.3);
            --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.3);
            --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.3);
            --glass: rgba(30, 41, 59, 0.7);
            --glass-border: rgba(148, 163, 184, 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }

        body {
            background-color: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            overflow-x: hidden;
            transition: var(--transition);
        }

        /* Smooth transitions for theme changes */
        .navbar, .card, .product-card, .stat-card, .sidebar, 
        .btn, input, select, textarea, .table, .modal-content {
            transition: background-color 0.3s ease, 
                       border-color 0.3s ease, 
                       color 0.3s ease,
                       box-shadow 0.3s ease;
        }
        /* =======================
   MOAB Logo Branding
======================= */

.moab-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
}

.moab-logo {
    width: 52px;
    height: 52px;
    object-fit: contain;
    border-radius: 12px;
    padding: 6px;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-sm);
    transition: var(--transition);
}

.moab-brand:hover .moab-logo {
    transform: rotate(-5deg) scale(1.08);
    box-shadow: var(--shadow-lg);
}

        /* Admin Container */
        .admin-container {
            display: flex;
            min-height: 100vh;
            background: var(--bg-secondary);
        }

        /* Enhanced Sidebar */
        .sidebar {
            width: var(--sidebar-width);
            background: var(--bg-card);
            border-right: 1px solid var(--border-color);
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 1000;
            transition: var(--transition);
            overflow-y: auto;
            box-shadow: var(--shadow);
        }

        .sidebar.collapsed {
            width: var(--sidebar-collapsed);
        }

        .sidebar-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 80px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--primary);
            font-weight: 800;
            font-size: 1.25rem;
        }

        .logo i {
            font-size: 1.5rem;
            color: var(--secondary);
        }

        .sidebar.collapsed .logo span {
            display: none;
        }

        .toggle-sidebar {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            color: var(--text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition);
        }

        .toggle-sidebar:hover {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .sidebar-menu {
            padding: 1rem 0;
            list-style: none;
        }

        .sidebar-menu li {
            margin-bottom: 0.25rem;
        }

        .sidebar-menu a {
            display: flex;
            align-items: center;
            padding: 0.875rem 1.5rem;
            color: var(--text-secondary);
            text-decoration: none;
            border-radius: var(--radius);
            margin: 0 0.5rem;
            transition: var(--transition);
            position: relative;
        }

        .sidebar-menu a:hover {
            background: var(--bg-secondary);
            color: var(--primary);
            transform: translateX(5px);
        }

        .sidebar-menu a.active {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            box-shadow: var(--shadow);
        }

        .sidebar-menu a.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 50%;
            background: var(--secondary);
            border-radius: 0 4px 4px 0;
        }

        .menu-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 0.75rem;
            font-size: 1.1rem;
        }

        .sidebar.collapsed .menu-icon {
            margin-right: 0;
        }

        .menu-text {
            font-weight: 500;
            white-space: nowrap;
        }

        .sidebar.collapsed .menu-text {
            display: none;
        }

        .menu-badge {
            margin-left: auto;
            background: var(--danger);
            color: white;
            font-size: 0.75rem;
            padding: 0.125rem 0.5rem;
            border-radius: 50px;
            min-width: 20px;
            text-align: center;
        }

        .sidebar.collapsed .menu-badge {
            display: none;
        }

        /* Language Selector */
        .language-selector {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border-color);
            margin-top: auto;
        }

        .language-selector select {
            width: 100%;
            padding: 0.625rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            color: var(--text-primary);
            font-size: 0.875rem;
            cursor: pointer;
            transition: var(--transition);
        }

        .language-selector select:hover {
            border-color: var(--primary);
        }

        /* Main Content */
        .main-content {
            flex: 1;
            margin-left: var(--sidebar-width);
            transition: var(--transition);
            min-height: 100vh;
        }

        .sidebar.collapsed ~ .main-content {
            margin-left: var(--sidebar-collapsed);
        }

        /* Header */
        .header {
            background: var(--bg-card);
            border-bottom: 1px solid var(--border-color);
            padding: 1rem 2rem;
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: var(--shadow-sm);
        }

        .header h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        /* Theme Toggle */
        .theme-toggle {
            position: relative;
            width: 50px;
            height: 26px;
        }

        .theme-toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--gray-light);
            border-radius: 34px;
            transition: var(--transition);
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 4px;
            bottom: 4px;
            background: var(--bg-primary);
            border-radius: 50%;
            transition: var(--transition);
            box-shadow: var(--shadow);
        }

        input:checked + .toggle-slider {
            background: var(--primary);
        }

        input:checked + .toggle-slider:before {
            transform: translateX(24px);
        }

        .toggle-icons {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 0 6px;
            pointer-events: none;
            font-size: 10px;
        }

        .toggle-icons i {
            color: var(--text-secondary);
        }

        /* User Info */
        .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.5rem 1rem;
            background: var(--bg-secondary);
            border-radius: var(--radius);
            border: 1px solid var(--border-color);
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 1rem;
        }

        .user-details h4 {
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 0.125rem;
        }

        .user-details small {
            font-size: 0.75rem;
            color: var(--text-secondary);
        }

        /* Notification Dropdown */
        .notification-dropdown {
            position: relative;
        }

        .notification-bell {
            position: relative;
            width: 40px;
            height: 40px;
            border-radius: var(--radius);
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: var(--transition);
        }

        .notification-bell:hover {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .notification-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: var(--danger);
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: 600;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .notification-content {
            position: absolute;
            right: 0;
            top: 100%;
            margin-top: 0.5rem;
            width: 350px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            box-shadow: var(--shadow-xl);
            display: none;
            z-index: 1000;
        }

        .notification-content.show {
            display: block;
            animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Dashboard Stats */
        .dashboard-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
            padding: 2rem;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 1.5rem;
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary);
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
        }

        .stat-icon {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-bottom: 1rem;
            background: var(--bg-secondary);
            color: var(--primary);
        }

        .stat-info h3 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }

        .stat-info p {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        /* Tabs */
        .tabs-container {
            padding: 0 2rem 1rem;
        }

        .tabs {
            display: flex;
            gap: 0.5rem;
            border-bottom: 1px solid var(--border-color);
            overflow-x: auto;
        }

        .tab {
            padding: 0.75rem 1.5rem;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            font-weight: 500;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: var(--transition);
            white-space: nowrap;
        }

        .tab:hover {
            color: var(--primary);
        }

        .tab.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }

        /* Tab Content */
        .tab-content {
            display: none;
            padding: 2rem;
        }

        .tab-content.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        /* Cards */
        .card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            margin-bottom: 1.5rem;
            overflow: hidden;
            box-shadow: var(--shadow);
        }

        .card-header {
            padding: 1.25rem 1.5rem;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .card-header h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .card-body {
            padding: 1.5rem;
            overflow-x: auto;
        }

        /* Tables */
        .table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
        }

        .table th,
        .table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        .table th {
            background: var(--bg-secondary);
            font-weight: 600;
            color: var(--text-primary);
            position: sticky;
            top: 0;
        }

        .table tr:hover {
            background: var(--bg-secondary);
        }

        /* Status Badges */
        .status {
            padding: 0.25rem 0.75rem;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
        }

        .status-pending {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
        }

        .status-approved {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .status-rejected {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
        }

        /* Buttons */
        .btn {
            padding: 0.625rem 1.25rem;
            border-radius: var(--radius);
            border: 1px solid transparent;
            font-weight: 500;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: var(--transition);
            font-size: 0.875rem;
        }

        .btn-sm {
            padding: 0.375rem 0.75rem;
            font-size: 0.75rem;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .btn-primary:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: var(--shadow);
        }

        .btn-success {
            background: var(--success);
            color: white;
            border-color: var(--success);
        }

        .btn-danger {
            background: var(--danger);
            color: white;
            border-color: var(--danger);
        }

        .btn-secondary {
            background: var(--bg-secondary);
            color: var(--text-primary);
            border-color: var(--border-color);
        }

        /* Action Buttons */
        .action-cell {
            display: flex;
            gap: 0.5rem;
        }

        /* Products Grid */
        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
        }

        .product-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            overflow: hidden;
            transition: var(--transition);
        }

        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary);
        }

        .product-image {
            height: 160px;
            background: var(--bg-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }

        .product-card:hover .product-image img {
            transform: scale(1.1);
        }

        .product-info {
            padding: 1.25rem;
        }

        .product-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }

        .product-price {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 1rem;
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1100;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
        }

        .modal-content {
            background: var(--bg-card);
            border-radius: var(--radius);
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: var(--shadow-xl);
        }

        /* Mobile Menu Toggle */
        .mobile-menu-toggle {
            display: none;
            position: fixed;
            top: 1rem;
            left: 1rem;
            width: 40px;
            height: 40px;
            background: var(--primary);
            color: white;
            border-radius: var(--radius);
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1001;
            box-shadow: var(--shadow);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
            .dashboard-stats {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 992px) {
            .sidebar {
                transform: translateX(-100%);
            }
            
            .sidebar.show {
                transform: translateX(0);
            }
            
            .sidebar.collapsed {
                width: var(--sidebar-width);
                transform: translateX(-100%);
            }
            
            .sidebar.collapsed.show {
                transform: translateX(0);
            }
            
            .main-content {
                margin-left: 0;
            }
            
            .mobile-menu-toggle {
                display: flex;
            }
        }

        @media (max-width: 768px) {
            .dashboard-stats {
                grid-template-columns: 1fr;
            }
            
            .header {
                flex-direction: column;
                gap: 1rem;
                padding: 1rem;
            }
            
            .header-actions {
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .tabs {
                flex-wrap: wrap;
            }
            
            .products-grid {
                grid-template-columns: 1fr;
            }
            
            .notification-content {
                width: 300px;
                right: -50px;
            }
        }

        @media (max-width: 480px) {
            .tabs-container,
            .tab-content,
            .dashboard-stats {
                padding: 1rem;
            }
            
            .notification-content {
                width: 280px;
                right: -100px;
            }
            
            .action-cell {
                flex-direction: column;
            }
            
            .btn {
                width: 100%;
                justify-content: center;
            }
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--bg-secondary);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--gray);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--primary);
        }

        /* Loading Animation */
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid var(--border-color);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--text-secondary);
        }

        .empty-state i {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.5;
        }
        /* =======================
   MOAB Logo Branding
======================= */

.moab-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
}

.moab-logo {
    width: 52px;
    height: 52px;
    object-fit: contain;
    border-radius: 12px;
    padding: 6px;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    box-shadow: var(--shadow-sm);
    transition: var(--transition);
}

.moab-brand:hover .moab-logo {
    transform: rotate(-5deg) scale(1.08);
    box-shadow: var(--shadow-lg);
}
    </style>
</head>
<body>
    <!-- Mobile Menu Toggle -->
    <div class="mobile-menu-toggle" id="mobileMenuToggle">
        <i class="fas fa-bars"></i>
    </div>

    <div class="admin-container">
        <!-- Enhanced Sidebar -->
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <a class="navbar-brand moab-brand" href="index.php">
                    <img src="images/moab1.png" alt="MOAB Logo" class="moab-logo">
                    <div class="brand-text">
                        <span class="org-name">MOAB</span>
                        <span class="platform-name">FarmLink Connect</span>
                    </div>
                </a>
                <button class="toggle-sidebar" id="toggleSidebar">
                    <i class="fas fa-chevron-left"></i>
                </button>
            </div>
            
            <ul class="sidebar-menu">
                <li>
                    <a href="#" class="active" data-tooltip="<?php echo ($_SESSION['lang'] == 'am') ? 'ዳሽቦርድ' : 'Dashboard'; ?>">
                        <div class="menu-icon">
                            <i class="fas fa-tachometer-alt"></i>
                        </div>
                        <span class="menu-text"><?php echo ($_SESSION['lang'] == 'am') ? 'ዳሽቦርድ' : 'Dashboard'; ?></span>
                    </a>
                </li>
                <li>
                    <a href="#" onclick="openTab('pending')" data-tooltip="<?php echo ($_SESSION['lang'] == 'am') ? 'በጥበቃ ላይ' : 'Pending'; ?>">
                        <div class="menu-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <span class="menu-text"><?php echo ($_SESSION['lang'] == 'am') ? 'በጥበቃ ላይ' : 'Pending'; ?></span>
                        <?php if ($counts['pending_approvals'] > 0): ?>
                        <span class="menu-badge"><?php echo $counts['pending_approvals']; ?></span>
                        <?php endif; ?>
                    </a>
                </li>
                <li>
                    <a href="#" onclick="openTab('farmers')" data-tooltip="<?php echo ($_SESSION['lang'] == 'am') ? 'ገበሬዎች' : 'Farmers'; ?>">
                        <div class="menu-icon">
                            <i class="fas fa-tractor"></i>
                        </div>
                        <span class="menu-text"><?php echo ($_SESSION['lang'] == 'am') ? 'ገበሬዎች' : 'Farmers'; ?></span>
                    </a>
                </li>
                <li>
                    <a href="#" onclick="openTab('sellers')" data-tooltip="<?php echo ($_SESSION['lang'] == 'am') ? 'ሻጮች' : 'Sellers'; ?>">
                        <div class="menu-icon">
                            <i class="fas fa-store"></i>
                        </div>
                        <span class="menu-text"><?php echo ($_SESSION['lang'] == 'am') ? 'ሻጮች' : 'Sellers'; ?></span>
                    </a>
                </li>
                <li>
                    <a href="#" onclick="openTab('products')" data-tooltip="<?php echo ($_SESSION['lang'] == 'am') ? 'ምርቶች' : 'Products'; ?>">
                        <div class="menu-icon">
                            <i class="fas fa-seedling"></i>
                        </div>
                        <span class="menu-text"><?php echo ($_SESSION['lang'] == 'am') ? 'ምርቶች' : 'Products'; ?></span>
                    </a>
                </li>
                <li>
                    <a href="logout.php" data-tooltip="<?php echo ($_SESSION['lang'] == 'am') ? 'ውጣ' : 'Logout'; ?>">
                        <div class="menu-icon">
                            <i class="fas fa-sign-out-alt"></i>
                        </div>
                        <span class="menu-text"><?php echo ($_SESSION['lang'] == 'am') ? 'ውጣ' : 'Logout'; ?></span>
                    </a>
                </li>
            </ul>
            
            <!-- Language Selector -->
            <div class="language-selector">
                <select onchange="window.location='?lang='+this.value">
                    <option value="en" <?php if($_SESSION['lang'] == 'en') echo 'selected'; ?>>English</option>
                    <option value="am" <?php if($_SESSION['lang'] == 'am') echo 'selected'; ?>>አማርኛ</option>
                </select>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <!-- Header -->
            <div class="header">
                <h1><?php echo ($_SESSION['lang'] == 'am') ? 'የአስተዳዳሪ ዳሽቦርድ' : 'Admin Dashboard'; ?></h1>
                
                <div class="header-actions">
                    <!-- Theme Toggle -->
                    <div class="theme-toggle">
                        <input type="checkbox" id="themeToggle">
                        <label class="toggle-slider" for="themeToggle">
                            <div class="toggle-icons">
                                <i class="fas fa-sun"></i>
                                <i class="fas fa-moon"></i>
                            </div>
                        </label>
                    </div>
                    
                    <!-- Notifications -->
                    <div class="notification-dropdown">
                        <div class="notification-bell" id="notificationBell">
                            <i class="fas fa-bell"></i>
                            <?php if ($unread_notifications > 0): ?>
                            <span class="notification-badge"><?php echo $unread_notifications; ?></span>
                            <?php endif; ?>
                        </div>
                        <div class="notification-content" id="notificationDropdown">
                            <div class="card">
                                <div class="card-header">
                                    <h2><?php echo ($_SESSION['lang'] == 'am') ? 'ማሳወቂያዎች' : 'Notifications'; ?></h2>
                                    <form method="POST" style="display: inline;">
                                        <button type="submit" name="mark_all_read" class="btn btn-sm btn-primary"><?php echo ($_SESSION['lang'] == 'am') ? 'ሁሉንም እንደተነበቡ ምልክት አድርግ' : 'Mark All as Read'; ?></button>
                                    </form>
                                </div>
                                <div class="card-body">
                                    <?php if ($notifications_result->num_rows > 0): ?>
                                        <?php while ($notification = $notifications_result->fetch_assoc()): ?>
                                        <div class="notification-item <?php echo $notification['is_read'] ? '' : 'unread-notification'; ?>" 
                                             style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">
                                            <div style="font-weight: 600; margin-bottom: 0.25rem;">
                                                <?php echo htmlspecialchars($notification['message']); ?>
                                            </div>
                                            <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                                <?php echo $notification['Email']; ?>
                                            </div>
                                            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
                                                <?php echo date('M j, Y g:i A', strtotime($notification['created_at'])); ?>
                                                <?php if (!$notification['is_read']): ?>
                                                <form method="POST" style="display: inline; margin-left: 0.5rem;">
                                                    <input type="hidden" name="notification_id" value="<?php echo $notification['id']; ?>">
                                                    <input type="hidden" name="mark_notification_read" value="1">
                                                    <button type="submit" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.75rem;">
                                                        <i class="fas fa-check"></i> <?php echo ($_SESSION['lang'] == 'am') ? 'እንደተነበበ ምልክት አድርግ' : 'Mark as read'; ?>
                                                    </button>
                                                </form>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                        <?php endwhile; ?>
                                    <?php else: ?>
                                        <div class="empty-state">
                                            <i class="fas fa-bell-slash"></i>
                                            <p><?php echo ($_SESSION['lang'] == 'am') ? 'ምንም ማሳወቂያዎች የሉም' : 'No notifications'; ?></p>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- User Info -->
                    <div class="user-info">
                        <div class="user-avatar">A</div>
                        <div class="user-details">
                            <h4><?php echo ($_SESSION['lang'] == 'am') ? 'አስተዳዳሪ ተጠቃሚ' : 'Admin User'; ?></h4>
                            <small><?php echo ($_SESSION['lang'] == 'am') ? 'የተረጋገጠ መለያ' : 'Verified Account'; ?></small>
                        </div>
                    </div>
                </div>
            </div>

            <?php if (isset($success)): ?>
                <div class="message success-message" style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 1rem; margin: 1rem 2rem; border-radius: var(--radius); border: 1px solid var(--success);">
                    <?php echo $success; ?>
                </div>
            <?php endif; ?>
            
            <?php if (isset($error)): ?>
                <div class="message error-message" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 1rem; margin: 1rem 2rem; border-radius: var(--radius); border: 1px solid var(--danger);">
                    <?php echo $error; ?>
                </div>
            <?php endif; ?>

            <!-- Stats Cards -->
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-tractor"></i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo $counts['total_farmers']; ?></h3>
                        <p><?php echo ($_SESSION['lang'] == 'am') ? 'ጠቅላላ ገበሬዎች' : 'Total Farmers'; ?></p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-store"></i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo $counts['total_sellers']; ?></h3>
                        <p><?php echo ($_SESSION['lang'] == 'am') ? 'የተረጋገጡ ሻጮች' : 'Verified Sellers'; ?></p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo $counts['pending_approvals']; ?></h3>
                        <p><?php echo ($_SESSION['lang'] == 'am') ? 'በጥበቃ ላይ ያሉ ተጠቃሚ' : 'Pending Users'; ?></p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-seedling"></i>
                    </div>
                    <div class="stat-info">
                        <h3><?php echo $counts['pending_products']; ?></h3>
                        <p><?php echo ($_SESSION['lang'] == 'am') ? 'የተለቀቁ ምርቶች' : 'Published Products'; ?></p>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs-container">
                <div class="tabs">
                    <button class="tab active" onclick="openTab('pending')"><?php echo ($_SESSION['lang'] == 'am') ? 'በጥበቃ ላይ ያሉ ማፅደቂያዎች' : 'Pending Approvals'; ?></button>
                    <button class="tab" onclick="openTab('farmers')"><?php echo ($_SESSION['lang'] == 'am') ? 'ገበሬዎች' : 'Farmers'; ?></button>
                    <button class="tab" onclick="openTab('sellers')"><?php echo ($_SESSION['lang'] == 'am') ? 'ሻጮች' : 'Sellers'; ?></button>
                    <button class="tab" onclick="openTab('products')"><?php echo ($_SESSION['lang'] == 'am') ? 'ምርቶች' : 'Products'; ?></button>
                </div>
            </div>

            <!-- Tab Contents -->
            <div id="pending" class="tab-content active">
                <div class="card">
                    <div class="card-header">
                        <h2><?php echo ($_SESSION['lang'] == 'am') ? 'በጥበቃ ላይ ያሉ የመለያ ማፅደቂያዎች' : 'Pending Account Approvals'; ?></h2>
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="fas fa-sync"></i> <?php echo ($_SESSION['lang'] == 'am') ? 'አድስ' : 'Refresh'; ?>
                        </button>
                    </div>
                    <div class="card-body">
                        <?php if (empty($pendingAccounts)): ?>
                            <div class="empty-state">
                                <i class="fas fa-check-circle"></i>
                                <p><?php echo ($_SESSION['lang'] == 'am') ? 'ለማፅደቅ በጥበቃ ላይ ያሉ መለያዎች የሉም።' : 'No pending accounts for approval.'; ?></p>
                            </div>
                        <?php else: ?>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'የተጠቃሚ ስም' : 'Username'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'ዓይነት' : 'Type'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'አውታረ መረጃ' : 'Contact'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'ሁኔታ' : 'Status'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'ድርጊቶች' : 'Actions'; ?></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($pendingAccounts as $account): ?>
                                    <tr>
                                        <td><?php echo $account['id']; ?></td>
                                        <td><?php echo $account['username']; ?></td>
                                        <td><?php echo ($_SESSION['lang'] == 'am') ? (($account['type'] == 'farmer') ? 'ገበሬ' : 'ሻጭ') : ucfirst($account['type']); ?></td>
                                        <td><?php echo $account['contact']; ?></td>
                                        <td><span class="status status-pending"><?php echo ($_SESSION['lang'] == 'am') ? 'በጥበቃ ላይ' : 'Pending'; ?></span></td>
                                        <td class="action-cell">
                                            <form method="post" style="display: inline;">
                                                <input type="hidden" name="id" value="<?php echo $account['id']; ?>">
                                                <input type="hidden" name="type" value="<?php echo $account['type']; ?>">
                                                <input type="hidden" name="action" value="approve">
                                                <button type="submit" class="btn btn-success btn-sm">
                                                    <i class="fas fa-check"></i> <?php echo ($_SESSION['lang'] == 'am') ? 'ፀድቅ' : 'Approve'; ?>
                                                </button>
                                            </form>
                                            <form method="post" style="display: inline;">
                                                <input type="hidden" name="id" value="<?php echo $account['id']; ?>">
                                                <input type="hidden" name="type" value="<?php echo $account['type']; ?>">
                                                <input type="hidden" name="action" value="reject">
                                                <button type="submit" class="btn btn-danger btn-sm">
                                                    <i class="fas fa-times"></i> <?php echo ($_SESSION['lang'] == 'am') ? 'አትቀበል' : 'Reject'; ?>
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Farmers Tab -->
            <div id="farmers" class="tab-content">
                <div class="card">
                    <div class="card-header">
                        <h2><?php echo ($_SESSION['lang'] == 'am') ? 'የተመዘገቡ ገበሬዎች' : 'Registered Farmers'; ?></h2>
                    </div>
                    <div class="card-body">
                        <?php if (empty($farmers)): ?>
                            <div class="empty-state">
                                <i class="fas fa-users"></i>
                                <p><?php echo ($_SESSION['lang'] == 'am') ? 'የተፀዱት ገበሬዎች አልተገኙም።' : 'No approved farmers found.'; ?></p>
                            </div>
                        <?php else: ?>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'የተጠቃሚ ስም' : 'Username'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'አውታረ መረጃ' : 'Contact'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'የብሄራዊ መታወቂያ' : 'National ID'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'ሁኔታ' : 'Status'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'ድርጊቶች' : 'Actions'; ?></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($farmers as $farmer): ?>
                                    <tr>
                                        <td><?php echo $farmer['id']; ?></td>
                                        <td><?php echo $farmer['username']; ?></td>
                                        <td><?php echo $farmer['contact']; ?></td>
                                        <td><?php echo $farmer['national_id']; ?></td>
                                        <td><span class="status status-approved"><?php echo ($_SESSION['lang'] == 'am') ? 'ፀድቋል' : 'Approved'; ?></span></td>
                                        <td class="action-cell">
                                            <form method="post">
                                                <input type="hidden" name="id" value="<?php echo $farmer['id']; ?>">
                                                <input type="hidden" name="type" value="farmer">
                                                <input type="hidden" name="action" value="disapproved">
                                                <button type="submit" class="btn btn-danger btn-sm">
                                                    <i class="fas fa-ban"></i> <?php echo ($_SESSION['lang'] == 'am') ? 'አልፀደቀም' : 'Disapprove'; ?>
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Sellers Tab -->
            <div id="sellers" class="tab-content">
                <div class="card">
                    <div class="card-header">
                        <h2><?php echo ($_SESSION['lang'] == 'am') ? 'የተመዘገቡ ሻጮች' : 'Registered Sellers'; ?></h2>
                    </div>
                    <div class="card-body">
                        <?php if (empty($sellers)): ?>
                            <div class="empty-state">
                                <i class="fas fa-store"></i>
                                <p><?php echo ($_SESSION['lang'] == 'am') ? 'የተፀዱት ሻጮች አልተገኙም።' : 'No approved sellers found.'; ?></p>
                            </div>
                        <?php else: ?>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'ንግድ' : 'Business'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'አውታረ መረጃ' : 'Contact'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'ኢሜይል' : 'Email'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'ሁኔታ' : 'Status'; ?></th>
                                        <th><?php echo ($_SESSION['lang'] == 'am') ? 'ድርጊቶች' : 'Actions'; ?></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($sellers as $seller): ?>
                                    <tr>
                                        <td><?php echo $seller['id']; ?></td>
                                        <td><?php echo $seller['business_name']; ?></td>
                                        <td><?php echo $seller['contact']; ?></td>
                                        <td><?php echo $seller['email']; ?></td>
                                        <td><span class="status status-approved"><?php echo ($_SESSION['lang'] == 'am') ? 'ፀድቋል' : 'Approved'; ?></span></td>
                                        <td class="action-cell">
                                            <form method="post">
                                                <input type="hidden" name="id" value="<?php echo $seller['id']; ?>">
                                                <input type="hidden" name="type" value="seller">
                                                <input type="hidden" name="action" value="disapproved">
                                                <button type="submit" class="btn btn-danger btn-sm">
                                                    <i class="fas fa-ban"></i> <?php echo ($_SESSION['lang'] == 'am') ? 'አልፀደቀም' : 'Disapprove'; ?>
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Products Tab -->
            <div id="products" class="tab-content">
                <div class="card">
                    <div class="card-header">
                        <h2><?php echo ($_SESSION['lang'] == 'am') ? 'የእርሻ ምርቶች' : 'Farm Products'; ?></h2>
                    </div>
                    <div class="card-body">
                        <?php if (empty($allProducts)): ?>
                            <div class="empty-state">
                                <i class="fas fa-seedling"></i>
                                <p><?php echo ($_SESSION['lang'] == 'am') ? 'ምርቶች አልተገኙም።' : 'No products found.'; ?></p>
                            </div>
                        <?php else: ?>
                            <div class="products-grid">
                                <?php foreach ($allProducts as $product): 
                                    $product_image = !empty($product['product_image']) ? 
                                        'uploads/product_images/' . htmlspecialchars($product['product_image']) : 
                                        'https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=600&q=80';
                                ?>
                                <div class="product-card">
                                    <div class="product-image">
                                        <img src="<?php echo $product_image; ?>" 
                                             alt="<?php echo htmlspecialchars($product['name']); ?>"
                                             onerror="this.src='https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=600&q=80'">
                                    </div>
                                    <div class="product-info">
                                        <h3 class="product-title"><?php echo htmlspecialchars($product['name']); ?></h3>
                                        <div class="product-meta" style="margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                                            <?php echo ($_SESSION['lang'] == 'am') ? 'ገበሬ: ' : 'Farmer: '; ?>
                                            <?php echo htmlspecialchars($product['farmer_name']); ?>
                                        </div>
                                        <div class="product-meta" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                            <div class="product-price">
                                                ETB <?php echo number_format($product['price'], 2); ?>
                                            </div>
                                            <div class="product-stock">
                                                <?php echo $product['quantity'] . ' ' . $product['unit']; ?>
                                            </div>
                                        </div>
                                        <div class="product-actions">
                                            <span class="status status-approved" style="margin-right: auto;">
                                                <?php echo ($_SESSION['lang'] == 'am') ? 'ፀድቋል' : 'Approved'; ?>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Theme Toggle
        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;
        const savedTheme = localStorage.getItem('theme') || 'light';

        // Apply saved theme
        html.setAttribute('data-theme', savedTheme);
        themeToggle.checked = savedTheme === 'dark';

        themeToggle.addEventListener('change', () => {
            const theme = themeToggle.checked ? 'dark' : 'light';
            html.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });

        // Sidebar Toggle
        const sidebar = document.getElementById('sidebar');
        const toggleSidebar = document.getElementById('toggleSidebar');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');

        toggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            toggleSidebar.querySelector('i').classList.toggle('fa-chevron-left');
            toggleSidebar.querySelector('i').classList.toggle('fa-chevron-right');
        });

        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992) {
                if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    sidebar.classList.remove('show');
                }
            }
        });

        // Notification Dropdown
        const notificationBell = document.getElementById('notificationBell');
        const notificationDropdown = document.getElementById('notificationDropdown');

        notificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
        });

        // Close notifications when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationBell.contains(e.target) && !notificationDropdown.contains(e.target)) {
                notificationDropdown.classList.remove('show');
            }
        });

        // Tab Functionality
        function openTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Activate selected tab
            document.querySelectorAll('.tab').forEach(tab => {
                if (tab.onclick && tab.onclick.toString().includes(tabName)) {
                    tab.classList.add('active');
                }
            });
            
            // Update active menu in sidebar
            document.querySelectorAll('.sidebar-menu a').forEach(item => {
                item.classList.remove('active');
                if (item.onclick && item.onclick.toString().includes(tabName)) {
                    item.classList.add('active');
                }
            });
            
            // If opening pending tab, remove active from dashboard
            if (tabName === 'pending') {
                const dashboardLink = document.querySelector('.sidebar-menu a[data-tooltip*="Dashboard"]');
                if (dashboardLink) {
                    dashboardLink.classList.remove('active');
                }
            }
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) {
                sidebar.classList.remove('show');
            }
        });

        // Add smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Add loading animation to buttons on click
        document.querySelectorAll('button[type="submit"]').forEach(button => {
            button.addEventListener('click', function() {
                const originalText = this.innerHTML;
                this.innerHTML = '<span class="loading"></span> Processing...';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 2000);
            });
        });

        // Initialize with dashboard as active
        document.addEventListener('DOMContentLoaded', () => {
            const dashboardLink = document.querySelector('.sidebar-menu a.active');
            if (dashboardLink && dashboardLink.onclick.toString().includes('pending')) {
                openTab('pending');
            }
        });

        // Auto-refresh notifications every 30 seconds
        setInterval(() => {
            const unreadCount = document.querySelector('.notification-badge');
            if (unreadCount) {
                // Simulate new notification
                const count = parseInt(unreadCount.textContent);
                if (Math.random() > 0.7) { // 30% chance of new notification
                    unreadCount.textContent = count + 1;
                    unreadCount.style.animation = 'none';
                    void unreadCount.offsetWidth; // Trigger reflow
                    unreadCount.style.animation = 'pulse 2s infinite';
                }
            }
        }, 30000);

        // Add hover effects to cards
        document.querySelectorAll('.stat-card, .product-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });

        // Handle form submissions with feedback
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                if (form.method === 'post') {
                    const button = form.querySelector('button[type="submit"]');
                    if (button) {
                        const originalText = button.innerHTML;
                        button.innerHTML = '<span class="loading"></span> Processing...';
                        button.disabled = true;
                        
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        button.innerHTML = originalText;
                        button.disabled = false;
                    }
                }
            });
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl + D for dashboard
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                openTab('pending');
            }
            
            // Ctrl + T for theme toggle
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                themeToggle.click();
            }
            
            // Esc to close notifications
            if (e.key === 'Escape') {
                notificationDropdown.classList.remove('show');
            }
        });

        // Show welcome message
        window.onload = () => {
            const welcomeMessage = document.createElement('div');
            welcomeMessage.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--primary);
                color: white;
                padding: 1rem;
                border-radius: var(--radius);
                box-shadow: var(--shadow-lg);
                z-index: 1000;
                animation: slideIn 0.5s ease;
            `;
            
            welcomeMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-hand-wave"></i>
                    <span>Welcome back, Admin!</span>
                </div>
            `;
            
            document.body.appendChild(welcomeMessage);
            
            // Remove after 3 seconds
            setTimeout(() => {
                welcomeMessage.style.animation = 'slideOut 0.5s ease forwards';
                setTimeout(() => welcomeMessage.remove(), 500);
            }, 3000);
        };

        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    </script>
</body>
</html>