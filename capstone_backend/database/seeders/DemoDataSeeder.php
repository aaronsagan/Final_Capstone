<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\{User, Charity, DonationChannel, Campaign, Donation, FundUsageLog};

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create System Admin
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'System Admin',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'status' => 'active',
                'phone' => '09171111111'
            ]
        );

        // Create Demo Donor
        User::updateOrCreate(
            ['email' => 'donor@example.com'],
            [
                'name' => 'Demo Donor',
                'password' => bcrypt('password'),
                'role' => 'donor',
                'status' => 'active',
                'phone' => '09172222222',
                'address' => '123 Donor Street, Manila'
            ]
        );

        // Create Charity Admin
        $owner = User::updateOrCreate(
            ['email' => 'charityadmin@example.com'],
            [
                'name' => 'Charity Admin',
                'password' => bcrypt('password'),
                'role' => 'charity_admin',
                'status' => 'active',
                'phone' => '09173333333'
            ]
        );

        // Verified charity so it appears in public lists
        $charity = Charity::firstOrCreate(
            ['name' => 'HopeWorks Foundation'],
            [
                'owner_id' => $owner->id,
                'mission' => 'Transparent community support.',
                'vision' => 'A better future for all communities.',
                'contact_email' => 'contact@hopeworks.org',
                'contact_phone' => '09173333333',
                'address' => '456 Charity Ave, Quezon City',
                'region' => 'Metro Manila',
                'municipality' => 'Quezon City',
                'category' => 'Community Development',
                'verification_status' => 'approved',
            ]
        );

        // Display-only donation channel (e.g., GCash)
        DonationChannel::firstOrCreate(
            ['charity_id' => $charity->id, 'label' => 'GCash Main'],
            ['type' => 'gcash', 'details' => ['number' => '09171234567', 'account_name' => 'HopeWorks'], 'is_active' => true]
        );

        // One published campaign
        Campaign::firstOrCreate(
            ['charity_id' => $charity->id, 'title' => 'School Kits 2025'],
            ['description' => 'Provide school kits to 500 students.',
             'target_amount' => 250000, 'status' => 'published']
        );

        // Additional demo users
        User::updateOrCreate(
            ['email' => 'alice.donor@example.com'],
            [
                'name' => 'Alice Donor',
                'password' => bcrypt('password'),
                'role' => 'donor',
                'status' => 'active',
                'phone' => '09174444444'
            ]
        );

        $charityOwner2 = User::updateOrCreate(
            ['email' => 'owner2@example.com'],
            [
                'name' => 'Owner Two',
                'password' => bcrypt('password'),
                'role' => 'charity_admin',
                'status' => 'active',
                'phone' => '09175555555'
            ]
        );

        $charityOwner3 = User::updateOrCreate(
            ['email' => 'owner3@example.com'],
            [
                'name' => 'Owner Three',
                'password' => bcrypt('password'),
                'role' => 'charity_admin',
                'status' => 'active',
                'phone' => '09176666666'
            ]
        );

        // Pending charity application
        Charity::firstOrCreate(
            ['name' => 'Community Care Network'],
            [
                'owner_id' => $charityOwner2->id,
                'mission' => 'Support low-income families.',
                'vision' => 'Healthy and thriving communities.',
                'contact_email' => 'hello@ccn.org',
                'contact_phone' => '09170000001',
                'address' => '789 Community Rd, Makati',
                'region' => 'NCR',
                'municipality' => 'Makati',
                'category' => 'Poverty Alleviation',
                'verification_status' => 'pending',
            ]
        );

        // Rejected charity (to test rejected filter and flows)
        Charity::updateOrCreate(
            ['name' => 'Future Minds Initiative'],
            [
                'owner_id' => $charityOwner3->id,
                'mission' => 'STEM education access.',
                'vision' => 'Empowered youth innovators.',
                'contact_email' => 'contact@futureminds.org',
                'contact_phone' => '09170000002',
                'address' => '123 Innovation Park, Pasig',
                'region' => 'NCR',
                'municipality' => 'Pasig',
                'category' => 'Education',
                'verification_status' => 'rejected',
                'rejection_reason' => 'Insufficient documents',
            ]
        );

        // Extra campaign for variety
        Campaign::firstOrCreate(
            ['charity_id' => $charity->id, 'title' => 'Food Packs Q4'],
            [
                'description' => 'Distribute 1000 food packs before the holidays.',
                'target_amount' => 500000,
                'status' => 'published'
            ]
        );

        // Retrieve campaigns for seeding transactions
        $campaign1 = Campaign::where('charity_id', $charity->id)->where('title','School Kits 2025')->first();
        $campaign2 = Campaign::where('charity_id', $charity->id)->where('title','Food Packs Q4')->first();

        // Seed donations (completed + pending) for transactions page
        $donor = User::where('email','donor@example.com')->first();
        $alice = User::where('email','alice.donor@example.com')->first();

        if ($donor && $campaign1) {
            Donation::updateOrCreate(
                ['external_ref' => 'DEMO-TX-1001'],
                [
                    'donor_id' => $donor->id,
                    'charity_id' => $charity->id,
                    'campaign_id' => $campaign1->id,
                    'amount' => 2500.00,
                    'status' => 'completed',
                    'channel_used' => 'gcash',
                    'reference_number' => 'GC-' . rand(100000,999999),
                    'donated_at' => now()->subDays(2),
                ]
            );
        }

        if ($alice && $campaign2) {
            Donation::updateOrCreate(
                ['external_ref' => 'DEMO-TX-1002'],
                [
                    'donor_id' => $alice->id,
                    'charity_id' => $charity->id,
                    'campaign_id' => $campaign2->id,
                    'amount' => 12000.00,
                    'status' => 'completed',
                    'channel_used' => 'bank_transfer',
                    'reference_number' => 'BT-' . rand(100000,999999),
                    'donated_at' => now()->subDays(1),
                ]
            );

            Donation::updateOrCreate(
                ['external_ref' => 'DEMO-TX-1003'],
                [
                    'donor_id' => $alice->id,
                    'charity_id' => $charity->id,
                    'campaign_id' => $campaign2->id,
                    'amount' => 500.00,
                    'status' => 'pending',
                    'channel_used' => 'gcash',
                    'reference_number' => 'GC-' . rand(100000,999999),
                    'donated_at' => now(),
                ]
            );
        }

        // Seed fund usage logs for flows/outflows
        if ($campaign1) {
            FundUsageLog::firstOrCreate([
                'campaign_id' => $campaign1->id,
                'charity_id' => $charity->id,
                'amount' => 3000.00,
                'category' => 'supplies',
                'description' => 'Purchased notebooks and pens',
                'spent_at' => now()->subDays(1),
            ]);
        }

        if ($campaign2) {
            FundUsageLog::firstOrCreate([
                'campaign_id' => $campaign2->id,
                'charity_id' => $charity->id,
                'amount' => 15000.00,
                'category' => 'transport',
                'description' => 'Logistics and fuel for food pack distribution',
                'spent_at' => now()->subDays(1),
            ]);
        }
    }
}
