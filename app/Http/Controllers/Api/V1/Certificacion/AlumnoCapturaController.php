<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\StoreAlumnoCapturaRequest;
use App\Http\Requests\Certificacion\UpdateAlumnoCapturaRequest;
use App\Http\Resources\Certificacion\AlumnoResource;
use App\Models\Alumno;
use App\Services\Certificacion\CertificacionAlcanceService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AlumnoCapturaController extends Controller
{
        public function index(Request $request): AnonymousResourceCollection
    {
        $termino = $request->input('q');

        $alumnos = Alumno::query()
            ->when($termino, function ($query, $termino) {
                $query->where('curp', 'LIKE', "%{$termino}%")
                      ->orWhere('nombre', 'LIKE', "%{$termino}%")
                      ->orWhere('primer_apellido', 'LIKE', "%{$termino}%")
                      ->orWhere('segundo_apellido', 'LIKE', "%{$termino}%");
            })
            ->limit(100) 
            ->get();

        return AlumnoResource::collection($alumnos);
=======
    public function __construct(
        protected CertificacionAlcanceService $alcance,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Alumno::class);

        $query = Alumno::query();

        $user = $request->user();
        if ($user !== null) {
            $this->alcance->aplicarAlcanceAlumnos($query, $user);
        }

        $query
            ->when(
                (string) request()->string('q') !== '',
                function ($builder): void {
                    $term = '%'.(string) request()->string('q').'%';
                    $builder->where(function ($nested) use ($term): void {
                        $nested->where('curp', 'like', $term)
                            ->orWhere('nombre', 'like', $term)
                            ->orWhere('primer_apellido', 'like', $term)
                            ->orWhere('segundo_apellido', 'like', $term);
                    });
                }
            )
            ->when(
                (string) request()->string('curp') !== '',
                fn ($builder) => $builder->where('curp', 'like', '%'.(string) request()->string('curp').'%')
            )
            ->when(
                (string) request()->string('estatus') !== '',
                fn ($builder) => $builder->where('estatus', (string) request()->string('estatus'))
            )
            ->orderByDesc('id');

        return AlumnoResource::collection(
            $query->paginate((int) request()->integer('per_page', 20))->withQueryString()
        );
>>>>>>> 9578ba3 (Backend actualizado)
    }

    public function store(StoreAlumnoCapturaRequest $request): JsonResponse
    {
        $this->authorize('create', Alumno::class);

        $alumno = Alumno::query()->create($request->validated());

        return (new AlumnoResource($alumno->fresh()))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Alumno $alumno): AlumnoResource
    {
        $this->authorize('view', $alumno);

        return new AlumnoResource($alumno);
    }

    public function update(UpdateAlumnoCapturaRequest $request, Alumno $alumno): AlumnoResource
    {
        $this->authorize('update', $alumno);

        $alumno->fill($request->validated());
        $alumno->save();

        return new AlumnoResource($alumno->fresh());
    }
}