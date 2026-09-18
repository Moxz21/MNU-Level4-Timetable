(() => {
  const DATA = window.TIMETABLE_DATA;
  const STORAGE_KEY = 'mnu-level4-selection-v2';
  const state = { group: null, section: null };

  const $ = (id) => document.getElementById(id);
  const groupOptions = $('groupOptions');
  const sectionOptions = $('sectionOptions');
  const viewBtn = $('viewBtn');
  const changeBtn = $('changeBtn');
  const emptyChangeBtn = $('emptyChangeBtn');
  const printBtn = $('printBtn');
  const selectionScreen = $('selectionScreen');
  const timetableScreen = $('timetableScreen');
  const timetableGrid = $('timetableGrid');
  const mobileTimetable = $('mobileTimetable');
  const emptyState = $('emptyState');
  const studentTitle = $('studentTitle');
  const daySummary = $('daySummary');
  const selectionStatus = $('selectionStatus');
  const sectionHelp = $('sectionHelp');
  const downloadBtn = $('downloadBtn');
  const colorBanner = $('colorBanner');
  const printGroup = $('printGroup');
  const printSection = $('printSection');

  const GROUP_THEMES = {
    1: { name: 'Blue', dark: '#184b9c', light: '#eaf2ff', mid: '#b9cff6', text: '#173d78' },
    2: { name: 'Violet', dark: '#6b33c6', light: '#f1eafd', mid: '#d6bdf8', text: '#4f278f' },
    3: { name: 'Teal', dark: '#0f7f72', light: '#e8f8f5', mid: '#b7e4dd', text: '#0c5c53' }
  };

  const groupById = (id) => DATA.groups.find(g => g.id === Number(id));
  const selectedGroup = () => groupById(state.group);

  function formatTime12(value) {
    const match = String(value).match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return String(value);
    let hour = Number(match[1]);
    const minute = match[2];
    const period = hour >= 12 ? 'PM' : 'AM';
    hour %= 12;
    if (hour === 0) hour = 12;
    return `${String(hour).padStart(2, '0')}:${minute} ${period}`;
  }

  function formatSlot(slot) {
    const [start, end] = String(slot).split('–');
    if (!end) return formatTime12(slot);
    return `${formatTime12(start)} – ${formatTime12(end)}`;
  }

  function saveSelection() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ group: state.group, section: state.section }));
  }

  function loadSelection() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved) return;
      const g = groupById(saved.group);
      if (!g || !g.sections.includes(Number(saved.section))) return;
      state.group = g.id;
      state.section = Number(saved.section);
    } catch (_) {}
  }

  function renderGroups() {
    groupOptions.innerHTML = '';
    DATA.groups.forEach(group => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `option-btn group-${group.id}` + (state.group === group.id ? ' selected' : '');
      button.textContent = group.label;
      button.setAttribute('aria-pressed', String(state.group === group.id));
      button.addEventListener('click', () => {
        state.group = group.id;
        state.section = group.sections.includes(state.section) ? state.section : null;
        renderGroups();
        renderSections();
        updateViewButton();
        selectionStatus.textContent = `${group.label} selected. Choose a section ${group.sections[0]}–${group.sections[group.sections.length - 1]}.`;
      });
      groupOptions.appendChild(button);
    });
  }

  function renderSections() {
    sectionOptions.innerHTML = '';
    const group = selectedGroup();
    if (!group) {
      sectionHelp.textContent = 'Select a group first.';
      for (let i = 1; i <= 15; i++) addSectionButton(i, true);
      return;
    }
    sectionHelp.textContent = `Sections available for ${group.label}: ${group.sections[0]}–${group.sections[group.sections.length - 1]}.`;
    for (let i = 1; i <= 15; i++) addSectionButton(i, !group.sections.includes(i));
  }

  function addSectionButton(section, disabled) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-btn' + (state.section === section ? ' section-selected' : '');
    button.textContent = `Section ${section}`;
    button.disabled = disabled;
    button.setAttribute('aria-pressed', String(state.section === section));
    if (!disabled) {
      button.addEventListener('click', () => {
        state.section = section;
        renderSections();
        updateViewButton();
        selectionStatus.textContent = `Ready: Group ${state.group} + Section ${state.section}.`;
      });
    }
    sectionOptions.appendChild(button);
  }

  function updateViewButton() {
    viewBtn.disabled = !(state.group && state.section);
  }

  function appliesToSection(session, sectionId) {
    return session.sections == null ||
      (Array.isArray(session.sections) && (session.sections.includes('ALL') || session.sections.includes(sectionId)));
  }

  function filteredSessions() {
    if (!state.group || !state.section) return [];
    return DATA.sessions
      .filter(session => session.group === state.group)
      .filter(session => appliesToSection(session, state.section))
      .sort((a,b) => DATA.metadata.days.indexOf(a.day) - DATA.metadata.days.indexOf(b.day) ||
        DATA.metadata.timeSlots.indexOf(a.timeSlot) - DATA.metadata.timeSlots.indexOf(b.timeSlot));
  }

  function setTheme() {
    timetableScreen.classList.remove('group-1', 'group-2', 'group-3');
    timetableScreen.classList.add(`group-${state.group}`);
    const theme = GROUP_THEMES[state.group];
    colorBanner.textContent = `Group ${state.group} identity: ${theme.name} · Lecture cards use the darker tone; Section / Lab cards use the lighter tone.`;
  }

  function renderTimetable() {
    const sessions = filteredSessions();
    setTheme();
    studentTitle.textContent = `Group ${state.group} · Section ${state.section}`;
    printGroup.textContent = String(state.group);
    printSection.textContent = String(state.section);
    selectionScreen.classList.add('hidden');
    timetableScreen.classList.remove('hidden');
    emptyState.classList.toggle('hidden', sessions.length > 0);
    timetableGrid.classList.toggle('hidden', sessions.length === 0);
    mobileTimetable.classList.toggle('hidden', sessions.length === 0);

    renderDaySummary(sessions);
    if (!sessions.length) return;
    renderDesktopTable(sessions);
    renderMobileTable(sessions);
  }

  function renderDesktopTable(sessions) {
    const table = document.createElement('div');
    table.className = 'grid-table';
    const headTime = document.createElement('div');
    headTime.className = 'grid-head';
    headTime.textContent = 'Time';
    table.appendChild(headTime);
    DATA.metadata.days.forEach(day => {
      const head = document.createElement('div');
      head.className = 'grid-head day-accent';
      head.textContent = day;
      table.appendChild(head);
    });

    DATA.metadata.timeSlots.forEach(slot => {
      const time = document.createElement('div');
      time.className = 'time-label';
      time.textContent = formatSlot(slot);
      table.appendChild(time);

      DATA.metadata.days.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        sessions.filter(s => s.day === day && s.timeSlot === slot).forEach(session => {
          cell.appendChild(sessionCard(session));
        });
        table.appendChild(cell);
      });
    });

    timetableGrid.innerHTML = '';
    timetableGrid.appendChild(table);
  }

  function renderMobileTable(sessions) {
    mobileTimetable.innerHTML = '';
    DATA.metadata.days.forEach(day => {
      const daySessions = sessions.filter(s => s.day === day);
      const dayCard = document.createElement('section');
      dayCard.className = 'mobile-day';
      dayCard.innerHTML = `<div class="mobile-day-head"><strong>${escapeHtml(day)}</strong><span>${daySessions.length} session${daySessions.length === 1 ? '' : 's'}</span></div>`;

      DATA.metadata.timeSlots.forEach(slot => {
        const slotSessions = daySessions.filter(s => s.timeSlot === slot);
        if (!slotSessions.length) return;
        const slotEl = document.createElement('div');
        slotEl.className = 'mobile-slot';
        const title = document.createElement('div');
        title.className = 'mobile-slot-title';
        title.textContent = formatSlot(slot);
        slotEl.appendChild(title);
        slotSessions.forEach(s => slotEl.appendChild(sessionCard(s)));
        dayCard.appendChild(slotEl);
      });
      mobileTimetable.appendChild(dayCard);
    });
  }

  function sessionCard(session) {
    const card = document.createElement('article');
    const isSection = session.kind === 'section';
    card.className = `session-card ${isSection ? 'section' : 'lecture'}`;

    const type = document.createElement('div');
    type.className = 'session-type';
    type.textContent = isSection ? 'SECTION / LAB' : 'LECTURE';
    card.appendChild(type);

    const course = document.createElement('div');
    course.className = 'session-course';
    course.textContent = session.course;
    card.appendChild(course);

    const meta = document.createElement('div');
    meta.className = 'session-meta';
    addMeta(meta, 'Time', formatSlot(session.timeSlot));
    if (isSection) {
      addMeta(meta, 'Section(s)', Array.isArray(session.sections) ? session.sections.join(', ') : 'ALL');
      if (session.instructor && session.instructor !== 'Not specified in PDF') addMeta(meta, 'Instructor', session.instructor);
      if (session.location) addMeta(meta, 'Location', session.location);
    } else {
      addMeta(meta, 'Applies to', 'All sections in this group');
      if (session.instructor && session.instructor !== 'Not specified in PDF') addMeta(meta, 'Instructor', session.instructor);
      if (session.location) addMeta(meta, 'Room', session.location);
    }
    card.appendChild(meta);

    if (session.sourceCell) {
      const note = document.createElement('div');
      note.className = 'session-note';
      note.textContent = session.sourceCell;
      card.appendChild(note);
    }
    return card;
  }

  function addMeta(parent, label, value) {
    const row = document.createElement('div');
    row.className = 'meta-row';
    const labelEl = document.createElement('span');
    labelEl.className = 'label';
    labelEl.textContent = `${label}:`;
    const valueEl = document.createElement('span');
    valueEl.textContent = String(value);
    row.appendChild(labelEl);
    row.appendChild(valueEl);
    parent.appendChild(row);
  }

  function renderDaySummary(sessions) {
    daySummary.innerHTML = '';
    DATA.metadata.days.forEach(day => {
      const count = sessions.filter(s => s.day === day).length;
      const pill = document.createElement('div');
      pill.className = 'day-pill';
      const dayName = document.createElement('strong');
      dayName.textContent = day;
      const countText = document.createElement('span');
      countText.textContent = `${count} session${count === 1 ? '' : 's'}`;
      pill.appendChild(dayName);
      pill.appendChild(countText);
      daySummary.appendChild(pill);
    });
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  downloadBtn.addEventListener('click', () => {
    if (!state.group || !state.section) return;
    const link = document.createElement('a');
    link.href = `pdfs/G${state.group}_S${state.section}.pdf`;
    link.download = `MNU_Level4_Group${state.group}_Section${state.section}_Timetable.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  printBtn.addEventListener('click', () => {
    if (!state.group || !state.section) return;
    window.print();
  });

  function showSelection() {
    timetableScreen.classList.add('hidden');
    selectionScreen.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewBtn.addEventListener('click', () => {
    saveSelection();
    renderTimetable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  changeBtn.addEventListener('click', showSelection);
  emptyChangeBtn.addEventListener('click', showSelection);

  loadSelection();
  renderGroups();
  renderSections();
  updateViewButton();
  if (state.group && state.section) selectionStatus.textContent = `Saved selection: Group ${state.group} + Section ${state.section}.`;
})();
