import { useState, useEffect, useRef } from 'react'
import { Heart, Smile, ThumbsUp, MessageCircle, Send, Image, Scissors, ChevronDown, Loader2, X, Trash2 } from 'lucide-react'
import { api } from '@/services/api'
import { uploadsService } from '@/services/uploads.service'
import { useAuth } from '@/contexts/AuthContext'
import { useConfirm } from '@/contexts/ConfirmContext'
import { usePostsRealtime } from '@/hooks/useRealtimeAppointments'

interface Reaction { type: string; count: number; viewerReacted: boolean }
interface Comment {
  id: string; userId: string; authorName: string; authorAvatarUrl?: string; text: string
  createdAt: string; replies: Comment[]; reactions: Reaction[]
}
interface Post {
  id: string; authorId: string; content: string; imageUrl?: string
  authorName: string; authorAvatarUrl?: string; createdAt: string
  reactions: Reaction[]; comments: Comment[]
  tenantId: string; tenantName: string; tenantLogoUrl?: string | null
}

// `apiValue` is what the POST /reactions body expects (matches the backend ReactionType enum);
// `key` is what GET responses use to label grouped reaction counts (enum .ToString()).
const REACTIONS = [
  { apiValue: 1, key: 'Like', icon: ThumbsUp, label: 'Me gusta', color: 'text-blue-400' },
  { apiValue: 2, key: 'Love', icon: Heart, label: 'Me encanta', color: 'text-red-400' },
  { apiValue: 3, key: 'Funny', icon: Smile, label: 'Me divierte', color: 'text-yellow-400' },
]

function Avatar({ name, url, size = 'md' }: { name: string; url?: string; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
  if (url) {
    return <img src={url} alt={name} className={`${dims} rounded-full object-cover shrink-0`} />
  }
  return (
    <div className={`${dims} bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex items-center justify-center shrink-0`}>
      <Scissors className={size === 'sm' ? 'w-3 h-3 text-white' : 'w-4 h-4 text-white'} />
    </div>
  )
}

/** Facebook-style summary: top reaction icons (highest count first) + total, with a detail
 * breakdown on click (23.14.1). */
function ReactionSummary({ reactions }: { reactions: Reaction[] }) {
  const [showDetail, setShowDetail] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const sorted = reactions.filter(r => r.count > 0).sort((a, b) => b.count - a.count)
  const total = sorted.reduce((s, r) => s + r.count, 0)

  useEffect(() => {
    if (!showDetail) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDetail(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showDetail])

  if (total === 0) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setShowDetail(v => !v)}
        className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition-colors min-h-[32px]"
      >
        <span className="flex items-center -space-x-1">
          {sorted.map(r => {
            const meta = REACTIONS.find(x => x.key === r.type)
            if (!meta) return null
            return (
              <span key={r.type} className={`flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 ring-1 ring-zinc-900 ${meta.color}`}>
                {/* 23.17.1 — lucide icons are stroke-based; forcing fill=currentColor on Smile's
                    circular outline solidified it into a plain yellow disc, indistinguishable
                    from a generic color dot. Never fill — always render the same stroke icon
                    used in the picker. */}
                <meta.icon className="w-3.5 h-3.5" strokeWidth={2.25} />
              </span>
            )
          })}
        </span>
        <span>{total}</span>
      </button>

      {showDetail && (
        <div className="absolute bottom-full mb-2 left-0 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 shadow-xl z-10 space-y-1 w-[min(120px,calc(100vw-3rem))]">
          {sorted.map(r => {
            const meta = REACTIONS.find(x => x.key === r.type)
            if (!meta) return null
            return (
              <div key={r.type} className="flex items-center gap-2 text-xs">
                <meta.icon className={`w-3.5 h-3.5 ${meta.color}`} />
                <span className="text-zinc-300">{meta.label}</span>
                <span className="text-zinc-500 ml-auto">{r.count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReactionBar({ post, onReact }: { post: Post; onReact: (postId: string, apiValue: number) => void }) {
  const [show, setShow] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const userReaction = post.reactions.find(r => r.viewerReacted)
  const activeReact = REACTIONS.find(r => r.key === userReaction?.type)

  // Click-to-toggle (not hover) so the picker actually opens on touch devices, and a click
  // outside closes it — hover-based open/close was unreliable on mobile and flickered on
  // desktop, which is why reactions "only ever registered the default" (23.12.1).
  useEffect(() => {
    if (!show) return
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [show])

  function pick(apiValue: number) {
    onReact(post.id, apiValue)
    setShow(false)
  }

  return (
    <div className="flex items-center gap-3">
      <ReactionSummary reactions={post.reactions} />
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors min-h-[44px] px-1 ${activeReact ? activeReact.color : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {activeReact ? <activeReact.icon className="w-4 h-4" /> : <ThumbsUp className="w-4 h-4" />}
          <span>{activeReact ? activeReact.label : 'Reaccionar'}</span>
        </button>

        {show && (
          <div className="absolute bottom-11 left-0 bg-zinc-800 border border-zinc-700 rounded-2xl px-3 py-2 flex gap-3 shadow-xl z-10">
            {REACTIONS.map(r => (
              <button
                key={r.apiValue}
                type="button"
                onClick={() => pick(r.apiValue)}
                className={`flex flex-col items-center gap-1 transition-transform hover:scale-125 min-w-[40px] min-h-[40px] justify-center ${r.color}`}
                title={r.label}
              >
                <r.icon className="w-6 h-6" />
                <span className="text-[10px] text-zinc-400">{r.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CommentReactionPicker({ comment, onRefresh }: { comment: Comment; onRefresh: () => void }) {
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = REACTIONS.find(r => r.key === comment.reactions.find(x => x.viewerReacted)?.type)

  useEffect(() => {
    if (!show) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [show])

  async function pick(apiValue: number) {
    await api.post(`/posts/comments/${comment.id}/reactions`, { type: apiValue })
    setShow(false); onRefresh()
  }

  return (
    <div className="relative inline-flex items-center gap-2" ref={ref}>
      {/* 23.15.3 — same icon set as the picker below, never a text label, so the open/closed
          states never visually disagree. */}
      <ReactionSummary reactions={comment.reactions} />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className={`text-xs transition-colors min-h-[32px] ${active ? active.color : 'text-zinc-600 hover:text-zinc-400'}`}
      >
        {active ? active.label : 'Reaccionar'}
      </button>
      {show && (
        <div className="absolute bottom-7 left-0 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-1.5 flex gap-2 shadow-xl z-10">
          {REACTIONS.map(r => (
            <button
              key={r.apiValue}
              type="button"
              onClick={() => pick(r.apiValue)}
              className={`transition-transform hover:scale-125 min-w-[28px] min-h-[28px] flex items-center justify-center ${r.color}`}
              title={r.label}
            >
              <r.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CommentBlock({ comment, postId, onRefresh }: { comment: Comment; postId: string; onRefresh: () => void }) {
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')

  async function sendReply() {
    if (!replyText.trim()) return
    await api.post(`/posts/${postId}/comments`, { text: replyText.trim(), parentCommentId: comment.id })
    setReplyText(''); setReplying(false); onRefresh()
  }

  return (
    <div className="flex gap-2">
      <Avatar name={comment.authorName} url={comment.authorAvatarUrl} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-zinc-800/50 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-red-500 mb-1">{comment.authorName}</p>
          <p className="text-zinc-300 text-sm">{comment.text}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-2">
          <CommentReactionPicker comment={comment} onRefresh={onRefresh} />
          <button onClick={() => setReplying(v => !v)} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Responder
          </button>
        </div>

        {replying && (
          <div className="flex gap-2 mt-2 ml-2">
            <input
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-600"
              placeholder="Escribe una respuesta..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendReply()}
              autoFocus
            />
            <button onClick={sendReply} className="text-red-600 hover:text-red-500 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {comment.replies?.length > 0 && (
          <div className="ml-4 mt-2 space-y-2 border-l-2 border-zinc-800 pl-3">
            {comment.replies.map(r => (
              <div key={r.id} className="flex gap-2">
                <Avatar name={r.authorName} url={r.authorAvatarUrl} size="sm" />
                <div className="bg-zinc-800/30 rounded-xl px-3 py-2 flex-1">
                  <p className="text-xs font-semibold text-zinc-400 mb-0.5">{r.authorName}</p>
                  <p className="text-zinc-400 text-sm">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PostCard({ post, onReact, onRefresh, canDelete, onDelete }: {
  post: Post; onReact: (id: string, type: number) => void; onRefresh: () => void
  canDelete: boolean; onDelete: (id: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')

  async function sendComment() {
    if (!commentText.trim()) return
    await api.post(`/posts/${post.id}/comments`, { text: commentText.trim() })
    setCommentText(''); onRefresh()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Avatar name={post.authorName} url={post.authorAvatarUrl} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white text-sm font-semibold">{post.authorName}</p>
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                  {post.tenantLogoUrl && <img src={post.tenantLogoUrl} alt="" className="w-3 h-3 rounded-sm object-cover" />}
                  {post.tenantName}
                </span>
              </div>
              <p className="text-zinc-500 text-xs">
                {new Date(post.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {canDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="text-zinc-600 hover:text-red-500 transition-colors shrink-0"
              title="Eliminar publicación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {post.imageUrl && (
        <img src={post.imageUrl} alt="Post" className="w-full max-h-96 object-cover" />
      )}

      <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
        <ReactionBar post={post} onReact={onReact} />
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments.length}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showComments ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showComments && (
        <div className="px-5 pb-4 space-y-3 border-t border-zinc-800 pt-3">
          {post.comments.map(c => (
            <CommentBlock key={c.id} comment={c} postId={post.id} onRefresh={onRefresh} />
          ))}

          <div className="flex gap-2 mt-3">
            <input
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-600"
              placeholder="Escribe un comentario..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendComment()}
            />
            <button onClick={sendComment} className="text-red-600 hover:text-red-500 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PostsPage() {
  const { user } = useAuth()
  const confirmDialog = useConfirm()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [tenantFilter, setTenantFilter] = useState<string | 'all'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isBarber = user?.role === 'Barber'

  // `load` only flips the full-page spinner for the very first fetch. Every later refresh
  // (after reacting, commenting, deleting, or a SignalR push) goes through `refresh`, which
  // swaps the `posts` array in place without ever unmounting the list — toggling `loading`
  // on every action was collapsing the page to a spinner and snapping scroll back to the top
  // on each interaction (23.12.6).
  async function load() {
    setLoading(true)
    try {
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  async function refresh() {
    try {
      const r = await api.get('/posts')
      setPosts(r.data ?? [])
    } catch { /* keep showing the previous list on a failed background refresh */ }
  }

  useEffect(() => { load() }, [])

  usePostsRealtime(() => refresh())

  async function handleReact(postId: string, type: number) {
    await api.post(`/posts/${postId}/reactions`, { type })
    refresh()
  }

  async function handleDelete(postId: string) {
    if (!await confirmDialog('Eliminar esta publicación? Esta acción no se puede deshacer.')) return
    await api.delete(`/posts/${postId}`)
    refresh()
  }

  async function uploadPostImage(file: File) {
    if (!file.type.startsWith('image/')) return
    setUploadingImage(true)
    try {
      const url = await uploadsService.uploadImage(file)
      setNewImageUrl(url)
    } catch {
      // best-effort — keep post creation usable without the image
    } finally {
      setUploadingImage(false)
    }
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadPostImage(file)
  }

  // 23.20.11 — arrastrar y soltar, además del selector de archivos por clic.
  function handleImageDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) uploadPostImage(file)
  }

  async function createPost() {
    if (!newContent.trim()) return
    setCreating(true)
    try {
      await api.post('/posts', { content: newContent.trim(), imageUrl: newImageUrl })
      setNewContent(''); setNewImageUrl(null); setShowCreate(false); refresh()
    } finally { setCreating(false) }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-white">Novedades</h1>
        <div className="flex items-center gap-2 shrink-0">
          {isBarber && (
            <button
              onClick={() => setShowCreate(v => !v)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              + Publicar
            </button>
          )}
        </div>
      </div>

      {/* 23.14.7 — only shown when the feed actually spans more than one barbershop's posts. */}
      {(() => {
        const tenantOptions = Array.from(new Map(posts.map(p => [p.tenantId, p.tenantName])).entries())
        if (tenantOptions.length < 2) return null
        return (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setTenantFilter('all')}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${tenantFilter === 'all' ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            >
              Todos
            </button>
            {tenantOptions.map(([id, name]) => (
              <button
                key={id}
                onClick={() => setTenantFilter(id)}
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${tenantFilter === id ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
              >
                {name}
              </button>
            ))}
          </div>
        )
      })()}

      {isBarber && showCreate && (
        <div className="bg-zinc-900 border border-red-600/30 rounded-2xl p-5 space-y-3">
          <textarea
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
            rows={4}
            placeholder="Comparte una novedad, foto de corte o informacion con tus clientes..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
          />

          {newImageUrl ? (
            <div className="relative">
              <img src={newImageUrl} alt="Vista previa" className="w-full max-h-56 object-cover rounded-xl" />
              <button
                onClick={() => setNewImageUrl(null)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleImageDrop}
              disabled={uploadingImage}
              className="w-full border border-dashed border-zinc-700 hover:border-red-600 rounded-xl py-4 flex items-center justify-center gap-2 text-zinc-500 hover:text-red-500 transition-colors text-sm"
            >
              {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
              {uploadingImage ? 'Subiendo imagen...' : 'Subir o arrastrar una foto (opcional)'}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowCreate(false); setNewImageUrl(null) }} className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2 rounded-xl text-sm transition-colors">
              Cancelar
            </button>
            <button
              onClick={createPost}
              disabled={creating || uploadingImage || !newContent.trim()}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-sm transition-colors"
            >
              {creating ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {(() => {
        const visible = tenantFilter === 'all' ? posts : posts.filter(p => p.tenantId === tenantFilter)
        if (loading) {
          return (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )
        }
        if (visible.length === 0) {
          return (
            <div className="text-center py-16">
              <Scissors className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">Aun no hay publicaciones</p>
              {isBarber && <p className="text-zinc-600 text-sm mt-1">Se el primero en compartir algo con tus clientes</p>}
            </div>
          )
        }
        return visible.map(p => (
          <PostCard key={p.id} post={p} onReact={handleReact} onRefresh={refresh} canDelete={p.authorId === user?.id || user?.role === 'SuperAdmin'} onDelete={handleDelete} />
        ))
      })()}
    </div>
  )
}
