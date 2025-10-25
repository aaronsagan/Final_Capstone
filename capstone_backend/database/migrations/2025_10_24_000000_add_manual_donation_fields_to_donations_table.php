<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            // For manual proof submissions
            if (!Schema::hasColumn('donations', 'donor_name')) {
                $table->string('donor_name')->nullable()->after('donor_id');
            }
            if (!Schema::hasColumn('donations', 'donor_email')) {
                $table->string('donor_email')->nullable()->after('donor_name');
            }
            if (!Schema::hasColumn('donations', 'channel_used')) {
                $table->string('channel_used')->nullable()->after('proof_type');
            }
            if (!Schema::hasColumn('donations', 'reference_number')) {
                $table->string('reference_number')->nullable()->after('channel_used');
            }
            if (!Schema::hasColumn('donations', 'message')) {
                $table->text('message')->nullable()->after('reference_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropColumn(['donor_name', 'donor_email', 'channel_used', 'reference_number', 'message']);
        });
    }
};
