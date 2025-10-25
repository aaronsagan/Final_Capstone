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
        Schema::table('charities', function (Blueprint $table) {
            if (!Schema::hasColumn('charities', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('verification_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('charities', function (Blueprint $table) {
            if (Schema::hasColumn('charities', 'rejection_reason')) {
                $table->dropColumn('rejection_reason');
            }
        });
    }
};
