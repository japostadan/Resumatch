function Header() {
return (
    <header className="border-b-2 border-line">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-8 py-4">
            <span className="flex items-center gap-2.5 text-sm font-bold tracking-wide uppercase">
                <span className="size-4 -rotate-6 bg-violet" />
                    Resumatch
                </span>
            <span className="ml-auto flex items-center gap-2 text-xs text-muted">
            <span className="size-2 rounded-full bg-status" />
                v0.1 · in development
            </span>
        </div>
    </header>)
}

export default Header;