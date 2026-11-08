<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Content\ContentService;
use App\Support\PaginationMeta;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private ContentService $content) {}

    public function listCategories(Request $request)
    {
        $admin = $request->user()?->isAdmin() ?? false;

        return $this->fromService(fn () => $this->content->listCategories($request->query('module'), $admin));
    }

    public function index(Request $request)
    {
        [$page, $perPage] = PaginationMeta::normalize(
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 20)
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

    public function show(Request $request, string $slug)
    {
        return $this->fromService(fn () => $this->content->getBySlug($slug, ContentService::viewerFromUser($request->user())));
    }

    public function continue(Request $request)
    {
        return $this->fromService(fn () => $this->content->continueLearning($request->user()->id));
    }

    public function listBookmarks(Request $request)
    {
        return $this->fromService(fn () => $this->content->listBookmarks($request->user()->id));
    }

    public function addBookmark(Request $request)
    {
        $data = $request->validate(['content_id' => ['required', 'uuid']]);

        return $this->fromService(function () use ($request, $data) {
            $this->content->addBookmark($request->user()->id, $data['content_id']);

            return null;
        }, 'Bookmark added', 201);
    }

    public function removeBookmark(Request $request, string $contentId)
    {
        return $this->fromService(function () use ($request, $contentId) {
            $this->content->removeBookmark($request->user()->id, $contentId);

            return null;
        }, 'Bookmark removed');
    }

    public function upsertHistory(Request $request, string $contentId)
    {
        $data = $request->validate([
            'progress_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'last_position_sec' => ['nullable', 'integer', 'min:0'],
            'completed' => ['nullable', 'boolean'],
        ]);

        return $this->fromService(function () use ($request, $contentId, $data) {
            $this->content->upsertHistory($request->user()->id, $contentId, $data);

            return null;
        }, 'History updated');
    }

    public function listHistory(Request $request)
    {
        return $this->fromService(fn () => $this->content->listHistory($request->user()->id));
    }
}
