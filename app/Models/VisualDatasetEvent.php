<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisualDatasetEvent extends Model
{
    protected $table = 'visual_dataset_events';

    protected $fillable = [
        'bucket',
        'estado',
        'summary',
        'detail',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }
}
