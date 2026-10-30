import { useLanguage } from '../../context/LanguageContext';

// A concert carries two clock times where a rehearsal carries one: the raccord
// (warm-up) the players are called in for, and the downbeat the audience comes
// for. The linked rehearsal row always starts at the raccord when there is one,
// so printing its time alone would tell a musician the concert begins two hours
// early. Every view that lists concerts beside rehearsals renders this instead.
//
// One inline-flex element, so it drops equally well into a `flex flex-wrap` row
// of meta chips and into a plain <p> of running text.
//
// Times come from MySQL as 'HH:MM:SS' and are wall-clock in the orchestra's own
// timezone, so they are printed as stored and never passed through Date.
const hhmm = (v) => (v ? String(v).slice(0, 5) : '');

export default function ConcertTimes({ warmup, start }) {
  const { t } = useLanguage();
  if (!warmup && !start) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
      &#128336;
      {warmup && <span>{t('common.warmup')} {hhmm(warmup)}</span>}
      {warmup && start && <span className="text-gray-400 dark:text-gray-500">&middot;</span>}
      {start && <span>{t('common.concertStart')} {hhmm(start)}</span>}
    </span>
  );
}
