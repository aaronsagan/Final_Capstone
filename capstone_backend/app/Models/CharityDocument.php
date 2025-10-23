<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CharityDocument extends Model
{
    protected $fillable = [
        'charity_id',
        'doc_type',     // registration|tax|bylaws|audit|other
        'file_path',
        'sha256',
        'uploaded_by',
        'verification_status',  // pending|approved|rejected
        'verified_by',
        'verified_at',
        'rejection_reason',
        'admin_notes',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    // Relationships
    public function charity()
    {
        return $this->belongsTo(Charity::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('verification_status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('verification_status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('verification_status', 'rejected');
    }
}
