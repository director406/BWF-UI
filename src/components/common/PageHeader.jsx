function PageHeader({ eyebrow, title, description }) {
  return (
    <section className="border-b border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-800 py-14">
      <div className="container-max">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-300">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}

export default PageHeader;

