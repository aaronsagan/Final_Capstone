<?php

namespace App\Http\Controllers;

use App\Models\DonationChannel;
use App\Models\Campaign;
use Illuminate\Http\Request;

class DonationChannelController extends Controller
{
    /**
     * Get all donation channels for a specific campaign (PUBLIC - for donors viewing campaign)
     */
    public function index(Campaign $campaign)
    {
        $channels = $campaign->donationChannels()
            ->where('is_active', true)
            ->get();

        return response()->json($channels);
    }

    public function getCharityChannels(Request $request)
    {
        $user = $request->user();
        $charityId = $user->charity_id ?? null;
        
        if (!$charityId) {
            $charity = \App\Models\Charity::where('owner_id', $user->id)->first();
            if (!$charity) {
                return response()->json(['error' => 'No charity found'], 404);
            }
            $charityId = $charity->id;
        }

        $channels = DonationChannel::where('charity_id', $charityId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($channels);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $charityId = $user->charity_id ?? null;
        
        // If charity_id is not directly on user, try the relationship
        if (!$charityId) {
            $charity = \App\Models\Charity::where('owner_id', $user->id)->first();
            if (!$charity) {
                return response()->json(['error' => 'No charity found for this user'], 404);
            }
            $charityId = $charity->id;
        }

        // Check limit
        $count = DonationChannel::where('charity_id', $charityId)->count();
        if ($count >= 10) {
            return response()->json(['error' => 'Maximum 10 channels allowed'], 422);
        }

        $request->validate([
            'type' => 'required|string',
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'label' => 'nullable|string|max:255',
            'qr_code' => 'nullable|image|max:2048',
        ]);

        $data = [
            'charity_id' => $charityId,
            'type' => $request->type,
            'account_name' => $request->account_name,
            'account_number' => $request->account_number,
            'label' => $request->label ?? ucfirst($request->type) . ' - ' . $request->account_number,
            'is_active' => true,
        ];

        if ($request->hasFile('qr_code')) {
            $path = $request->file('qr_code')->store('donation_channels', 'public');
            $data['qr_code_path'] = $path;
        }

        $channel = DonationChannel::create($data);

        return response()->json([
            'message' => 'Donation channel created successfully',
            'channel' => $channel
        ], 201);
    }

    // Update a donation channel
    public function update(Request $request, DonationChannel $channel)
    {
        $user = $request->user();
        $charityId = $user->charity_id ?? $user->charity->id ?? null;

        // Verify ownership
        if ($channel->charity_id !== $charityId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'type' => 'sometimes|in:gcash,maya,paymaya,paypal,bank,bank_transfer,ewallet,other',
            'label' => 'sometimes|string|max:255',
            'account_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'qr_code' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'details' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        // Handle QR code upload
        if ($request->hasFile('qr_code')) {
            // Delete old QR code if exists
            if ($channel->qr_code_path) {
                Storage::disk('public')->delete($channel->qr_code_path);
            }
            $validated['qr_code_path'] = $request->file('qr_code')->store('donation_channels/qr_codes', 'public');
        }

        $channel->update($validated);

        return response()->json([
            'message' => 'Donation channel updated successfully',
            'channel' => $channel
        ]);
    }

    // Delete a donation channel
    public function destroy(Request $request, DonationChannel $channel)
    {
        $user = $request->user();
        $charityId = $user->charity_id ?? $user->charity->id ?? null;

        // Verify ownership
        if ($channel->charity_id !== $charityId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete QR code if exists
        if ($channel->qr_code_path) {
            Storage::disk('public')->delete($channel->qr_code_path);
        }

        $channel->delete();

        return response()->json([
            'message' => 'Donation channel deleted successfully'
        ]);
    }

    // Toggle active status
    public function toggleActive(Request $request, DonationChannel $channel)
    {
        $user = $request->user();
        $charityId = $user->charity_id ?? $user->charity->id ?? null;

        // Verify ownership
        if ($channel->charity_id !== $charityId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $channel->update(['is_active' => !$channel->is_active]);

        return response()->json([
            'message' => 'Donation channel status updated',
            'channel' => $channel
        ]);
    }

    /**
     * Attach donation channels to a campaign
     */
    public function attachToCampaign(Request $request, Campaign $campaign)
    {
        $user = $request->user();
        $charity = $user->charity()->first();
        
        if (!$charity || $campaign->charity_id !== $charity->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'channel_ids' => 'required|array',
            'channel_ids.*' => 'required|exists:donation_channels,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verify all channels belong to the charity
        $channels = DonationChannel::whereIn('id', $request->channel_ids)
            ->where('charity_id', $charity->id)
            ->pluck('id');

        if ($channels->count() !== count($request->channel_ids)) {
            return response()->json(['error' => 'Some channels do not belong to your charity'], 422);
        }

        // Sync the channels (replaces existing associations)
        $campaign->donationChannels()->sync($request->channel_ids);

        return response()->json([
            'message' => 'Donation channels linked to campaign successfully',
            'channels' => $campaign->donationChannels
        ]);
    }
}
