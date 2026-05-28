<?php

declare(strict_types=1);

namespace App\Support\SicesLegacy;

final class SicesLegacyTextEncoding
{
    public static function toUtf8(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);
        if ($text === '') {
            return '';
        }

        $from = (string) config('sices_legacy.encoding', 'ISO-8859-1');
        if (mb_check_encoding($text, 'UTF-8') && $from === 'UTF-8') {
            return $text;
        }

        $converted = @mb_convert_encoding($text, 'UTF-8', $from);
        if ($converted !== false) {
            return $converted;
        }

        $iconv = @iconv($from, 'UTF-8//IGNORE', $text);

        return $iconv !== false ? $iconv : $text;
    }

    public static function fromUtf8(mixed $value): ?string
    {
        if ($value === null) {  
            return null;
        }

        $text = trim((string) $value);
        if ($text === '') {
            return '';
        }

        $to = (string) config('sices_legacy.encoding', 'ISO-8859-1');
        if ($to === 'UTF-8') {
            return $text;
        }

        $converted = @mb_convert_encoding($text, $to, 'UTF-8');
        if ($converted !== false) {
            return $converted;
        }

        $iconv = @iconv('UTF-8', $to.'//IGNORE', $text);

        return $iconv !== false ? $iconv : $text;
    }
}
