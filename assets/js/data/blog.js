/* Lanka Global Access — Blog data
 * Each post: id, title, category, date, readTime, author, excerpt, content (HTML string).
 * NOTE: dates are indicative sample content.
 */

const LGA_BLOG_POSTS = [
    {
        id: 'student-visa-interview-questions',
        title: 'Student Visa Interview: 10 Questions You Must Be Ready For',
        category: 'Visas',
        date: '2026-07-18',
        readTime: '6 min',
        author: 'LGA Counselling Team',
        excerpt: 'Consular officers decide in minutes. Here are the ten questions that decide most student visa interviews — and how to answer them convincingly.',
        content: `
            <p>The interview stage intimidates many applicants, but it shouldn't. Officers ask a small set of predictable questions designed to test one thing: <strong>are you a genuine student?</strong> Prepare honest, specific answers to these ten and you'll walk in calm.</p>
            <h3>1. Why this university?</h3>
            <p>Name concrete reasons: course structure, faculty research, facilities, rankings — never "my agent chose it".</p>
            <h3>2. Why this course? How does it connect to your past studies?</h3>
            <p>Show a logical academic thread from your A/Ls or degree into the program you've chosen.</p>
            <h3>3. Why this country and not another?</h3>
            <p>Compare on education quality, industry exposure or research strengths — not just lifestyle.</p>
            <h3>4. Who is funding your education?</h3>
            <p>Be precise: who pays, what they earn, what documents back it up. Vague answers here sink files.</p>
            <h3>5. What will you do after graduating?</h3>
            <p>Emphasise how the qualification strengthens your career plan at home — even if you may apply for work visas later, your stated intent must be genuine study.</p>
            <h3>6. Tell me about your accommodation plans</h3>
            <p>Know the city, typical rents, and whether you'll take university housing initially.</p>
            <h3>7. What do you know about the city where you'll live?</h3>
            <p>A little research signals seriousness — transport, weather, student communities.</p>
            <h3>8. Do you have relatives abroad?</h3>
            <p>Answer truthfully. Inconsistencies discovered later are far worse than an honest "yes" now.</p>
            <h3>9. What will you do during breaks?</h3>
            <p>Mention travel or short courses — but anchor your answer to returning home for family and career.</p>
            <h3>10. Any final points?</h3>
            <p>Use this to summarise your preparation in two confident sentences.</p>
            <p><strong>LGA runs free mock interviews for every client we lodge.</strong> Practise these answers aloud until they sound natural — not memorised.</p>`
    },
    {
        id: 'ielts-vs-pte-guide',
        title: 'IELTS vs PTE: Which English Test Should You Actually Take?',
        category: 'English Tests',
        date: '2026-06-30',
        readTime: '5 min',
        author: 'LGA Training Unit',
        excerpt: 'Both tests are widely accepted — but scoring style, turnaround time and your personal strengths make one clearly smarter for you. Here\'s how to choose.',
        content: `
            <p>Nearly every study destination accepts both IELTS and PTE Academic today. So the question isn't acceptance — it's fit.</p>
            <h3>Choose PTE when…</h3>
            <ul>
                <li>You need results fast (typically 48 hours).</li>
                <li>You're comfortable speaking to a computer — AI scoring removes examiner nerves.</li>
                <li>You prefer integrated tasks that combine skills (one task can score listening + writing).</li>
                <li>Your destination is Australia or New Zealand, where every university accepts it.</li>
            </ul>
            <h3>Choose IELTS when…</h3>
            <ul>
                <li>You're targeting the UK (some routes still expect IELTS for UKVI).</li>
                <li>You write well but freeze in front of screens — paper format exists.</li>
                <li>You want a human examiner for speaking who can follow natural conversation.</li>
                <li>Your programme lists band requirements per skill (IELTS makes these explicit).</li>
            </ul>
            <h3>The score conversion cheat sheet</h3>
            <p>Roughly: IELTS 6.0 ≈ PTE 50–57 · IELTS 6.5 ≈ PTE 58–64 · IELTS 7.0 ≈ PTE 65–78. Universities publish exact tables — we match them during counselling so you register for the right exam the first time.</p>
            <p>Our advice after coaching hundreds of students: <strong>take a diagnostic of each with us before booking either.</strong> The test that matches your instincts will always produce the better result.</p>`
    },
    {
        id: 'sop-that-wins-admissions',
        title: 'How to Write a Statement of Purpose That Wins Admissions',
        category: 'Applications',
        date: '2026-06-12',
        readTime: '7 min',
        author: 'LGA Counselling Team',
        excerpt: 'Your SOP is the only place admissions officers hear your voice. This structure has produced offers from Toronto to Melbourne for our students.',
        content: `
            <p>After reviewing thousands of applications, we can predict which SOPs succeed within the first paragraph. They follow a story logic, not a template feel.</p>
            <h3>The five-part structure</h3>
            <ol>
                <li><strong>The spark (10%)</strong> — a specific moment that started your interest. One vivid sentence beats three generic ones.</li>
                <li><strong>The foundation (25%)</strong> — academic background and projects that prove capability. Quantify everything.</li>
                <li><strong>The bridge (25%)</strong> — why THIS program fills a precise gap. Name modules, labs, professors.</li>
                <li><strong>The proof beyond class (20%)</strong> — internships, volunteering, leadership that show initiative.</li>
                <li><strong>The return (20%)</strong> — clear post-study goals connected to home-country demand. Visa officers read this section too.</li>
            </ol>
            <h3>Three mistakes that guarantee rejection</h3>
            <ul>
                <li>Copying templates found online — plagiarism detectors flag them instantly.</li>
                <li>Listing achievements without linking them to the course.</li>
                <li>Vague endings like "contribute to society". Name the industry, role and reason.</li>
            </ul>
            <p>Every LGA application includes two rounds of SOP editing by counsellors who know what each university's committee looks for. Bring us your draft — or your blank page.</p>`
    },
    {
        id: 'canada-gic-explained',
        title: 'Canada GIC Explained: Proof of Funds Without the Stress',
        category: 'Finances',
        date: '2026-05-22',
        readTime: '5 min',
        author: 'LGA Counselling Team',
        excerpt: 'The Guaranteed Investment Certificate confuses more Canadian applicants than any other requirement. Here\'s exactly how it works in 2026.',
        content: `
            <p>If you're applying under the SDS-style stream for Canada, a <strong>GIC (Guaranteed Investment Certificate)</strong> is usually your cleanest proof of funds.</p>
            <h3>What it actually is</h3>
            <p>You deposit roughly CAD 20,635 with a participating bank (Scotiabank, ICICI, SBI Canada, CIBC and others). After landing, the bank releases it back to you in monthly instalments over 12 months — essentially a built-in living-expense budget.</p>
            <h3>Why visa officers like it</h3>
            <ul>
                <li>Funds are verified by the bank itself — no document authenticity questions.</li>
                <li>It demonstrates planning, not last-minute borrowing.</li>
                <li>Combined with first-year tuition payment, it often speeds processing.</li>
            </ul>
            <h3>How to arrange one from Sri Lanka</h3>
            <ol>
                <li>Get your offer letter and apply to the bank online (passport + offer needed).</li>
                <li>Transfer the amount through a licensed channel — keep every receipt.</li>
                <li>Receive the Investment Balance Confirmation for your study permit file.</li>
                <li>Activate the account after arrival; funds begin releasing within weeks.</li>
            </ol>
            <p>Budget note: the GIC covers living costs — you'll still show tuition payment/ability separately. Our finance team walks every Canada-bound client through the exact current amounts before lodgement.</p>`
    },
    {
        id: 'post-study-work-rights-compared',
        title: 'Post-Study Work Rights Compared: Australia, Canada, UK, NZ & USA',
        category: 'Destinations',
        date: '2026-04-15',
        readTime: '8 min',
        author: 'LGA Research Desk',
        excerpt: 'Where you study decides how long you can stay and work after graduating. We compare the headline rules across all five major destinations.',
        content: `
            <p>For many families, post-study work rights tip the country decision as much as tuition. Here's the 2026 snapshot.</p>
            <h3>Australia — Temporary Graduate (subclass 485)</h3>
            <p>Bachelor graduates: ~2 years. Master's: 2–4 years depending on qualification length. Regional study adds extra years. Work limit during study: 48 hrs/fortnight.</p>
            <h3>Canada — PGWP</h3>
            <p>Up to 3 years for programs of 2+ years at eligible DLIs. Open work permit — any employer. Strong PR bridges via Express Entry CEC and PNPs.</p>
            <h3>United Kingdom — Graduate Route</h3>
            <p>Flat 2 years for bachelor's/master's completers, 3 for PhD. No job offer required, no salary threshold during the route — switch to skilled work later.</p>
            <h3>New Zealand — Post-Study Work Visa</h3>
            <p>Level 7 bachelor's+: up to 3 years depending on qualification. Employers can hire graduates in most roles without labour-market tests.</p>
            <h3>USA — OPT &amp; STEM OPT</h3>
            <p>12 months of Optional Practical Training for F-1 graduates, extended by 24 more months for STEM-designated degrees. Employer-sponsored H-1B is the usual next step.</p>
            <h3>How to choose</h3>
            <p>Optimising purely on stay-back duration ignores employability: Canada rewards permanent-settlement intent; Australia favours regional campuses; the US pays highest but is lottery-driven. Book a counselling session — we model total outcomes per country against your profile.</p>`
    }
];

function lgaPostById(id) {
    return LGA_BLOG_POSTS.find(p => p.id === id);
}

function lgaFormatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return iso; }
}
