<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Content\ContentService;
use App\Support\PaginationMeta;
use Illuminate\Http\Request;

class AdminContentController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private ContentService $content) {}

    public function listCategories(Request $request)
    {
        return $this->fromService(fn () => $this->content->listCategories($request->query('module'), true));
    }

    public function createCategory(Request $request)
    {
        return $this->fromService(
            fn () => $this->content->createCategory($request->all()),
            'Category created',
            201
        );
    }

    public function updateCategory(Request $request, string $id)
    {
        return $this->fromService(fn () => $this->content->updateCategory($id, $request->all()), 'Category updated');
    }

    public function deleteCategory(string $id)
    {
        return $this->fromService(function () use ($id) {
            $this->content->deleteCategory($id);

            return null;
        }, 'Category deleted');
    }

    public function index(Request $request)
    {
        [$page, $perPage] = PaginationMeta::normalize(
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 100)
        );
        $viewer = ContentService::viewerFromUser($request->user());

        return $this->fromService(fn () => $this->paginated(
            fn () => $this->content->listContents([
                'module' => $request->query('module'),
                'type' => $request->query('type'),
                'category_id' => $request->query('category_id'),
                'q' => $request->query('q'),
                'status' => $request->query('status'),
            ], $viewer, $page, $perPage),
            $page,
            $perPage
        ));
    }

    public function show(string $id)
    {
        return $this->fromService(fn () => $this->content->adminGet($id));
    }

    public function store(Request $request)
    {
        return $this->fromService(
            fn () => $this->content->createContent($request->user(), $request->all()),
            'Content created',
            201
        );
    }

    public function update(Request $request, string $id)
    {
        return $this->fromService(fn () => $this->content->updateContent($id, $request->all()), 'Content updated');
    }

    public function destroy(string $id)
    {
        return $this->fromService(function () use ($id) {
            $this->content->deleteContent($id);

            return null;
        }, 'Content deleted');
    }

    public function publish(string $id)
    {
        return $this->fromService(fn () => $this->content->publishContent($id), 'Content published');
    }

    public function reorder(Request $request)
    {
        return $this->fromService(function () use ($request) {
            $this->content->reorderContents(
                (string) $request->input('module', ''),
                $request->input('ids', [])
            );

            return null;
        }, 'Content reordered');
    }
}
