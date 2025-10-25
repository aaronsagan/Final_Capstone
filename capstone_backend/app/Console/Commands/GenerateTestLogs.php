<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ActivityLog;
use App\Models\User;
use Carbon\Carbon;

class GenerateTestLogs extends Command
{
    protected $signature = 'logs:generate-test';
    protected $description = 'Generate test activity logs for development';

    public function handle()
    {
        $this->info('Generating test activity logs...');

        // Get some users from the database
        $users = User::limit(5)->get();

        if ($users->isEmpty()) {
            $this->error('No users found in database. Please create users first.');
            return 1;
        }

        $actions = [
            'login',
            'logout',
            'register',
            'create_campaign',
            'update_campaign',
            'delete_campaign',
            'make_donation',
            'update_profile',
            'submit_report',
            'create_post',
            'update_post',
            'approve_charity',
            'reject_charity',
        ];

        $targetTypes = ['Campaign', 'Donation', 'Profile', 'Report', 'User', 'Charity', 'Post'];

        $count = 0;

        // Generate 50 test logs
        for ($i = 0; $i < 50; $i++) {
            $user = $users->random();
            $action = $actions[array_rand($actions)];
            $targetType = $targetTypes[array_rand($targetTypes)];

            $details = [
                'description' => $this->generateDescription($user->name, $action),
                'target_type' => $targetType,
                'target_id' => rand(1, 100),
            ];

            // Add specific details based on action
            if ($action === 'make_donation') {
                $details['amount'] = rand(100, 10000);
                $details['charity_id'] = rand(1, 10);
                $details['campaign_id'] = rand(1, 20);
            } elseif (in_array($action, ['create_campaign', 'update_campaign', 'delete_campaign'])) {
                $details['campaign_title'] = 'Test Campaign ' . rand(1, 100);
            } elseif (in_array($action, ['approve_charity', 'reject_charity'])) {
                $details['charity_name'] = 'Test Charity ' . rand(1, 50);
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'user_role' => $user->role,
                'action' => $action,
                'details' => $details,
                'ip_address' => $this->generateRandomIP(),
                'user_agent' => 'Mozilla/5.0 (Test Browser)',
                'session_id' => 'test_session_' . uniqid(),
                'created_at' => Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23)),
                'updated_at' => Carbon::now(),
            ]);

            $count++;
        }

        $this->info("Successfully generated {$count} test activity logs!");
        $this->info('You can now view them in the Action Logs page.');

        return 0;
    }

    private function generateDescription($userName, $action)
    {
        $descriptions = [
            'login' => "{$userName} logged in",
            'logout' => "{$userName} logged out",
            'register' => "{$userName} registered an account",
            'create_campaign' => "{$userName} created a campaign",
            'update_campaign' => "{$userName} updated a campaign",
            'delete_campaign' => "{$userName} deleted a campaign",
            'make_donation' => "{$userName} made a donation",
            'update_profile' => "{$userName} updated their profile",
            'submit_report' => "{$userName} submitted a report",
            'create_post' => "{$userName} created a post",
            'update_post' => "{$userName} updated a post",
            'delete_post' => "{$userName} deleted a post",
            'approve_charity' => "{$userName} approved a charity",
            'reject_charity' => "{$userName} rejected a charity",
        ];

        return $descriptions[$action] ?? "{$userName} performed action: {$action}";
    }

    private function generateRandomIP()
    {
        return rand(1, 255) . '.' . rand(0, 255) . '.' . rand(0, 255) . '.' . rand(1, 255);
    }
}
