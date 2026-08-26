export const GESTAO_PANELS = [
  {
    id: "p1",
    title: "Produção 1",
    subtitle: "Karoline · Thais · Renato",
    users: [
      { match: "Karoline", label: "Karoline" },
      { match: "thais", label: "Thais" },
      { match: "Renato", label: "Renato" }
    ]
  },
  {
    id: "p2",
    title: "Produção 2",
    subtitle: "André · Rafael · Vidal",
    users: [
      { match: "Andre Guilherme", label: "André" },
      { match: "Rafael", label: "Rafael" },
      { match: "Vidal", label: "Vidal" }
    ]
  },
  {
    id: "p3",
    title: "Produção 3",
    subtitle: "Jorge · Keytman · Fernanda",
    users: [
      { match: "Jorge", label: "Jorge" },
      { match: "keytman", label: "Keytman" },
      { match: "fernanda", label: "Fernanda" }
    ]
  },
  {
    id: "p4",
    title: "Produção 4",
    subtitle: "Fran · Noemi · Diego",
    users: [
      { match: "fran dias", label: "Fran" },
      { match: "noemi", label: "Noemi" },
      { match: "Diego", label: "Diego" }
    ]
  },
  {
    id: "p5",
    title: "Produção 5",
    subtitle: "Vinicius · Hewerton · Claudia",
    users: [
      { match: "Vinicius", label: "Vinicius" },
      { match: "Heverton", label: "Hewerton" },
      { match: "claudia", label: "Claudia" }
    ]
  },
  {
    id: "p6",
    title: "Produção 6",
    subtitle: "Marcos · Almir · Kauan",
    users: [
      { match: "Marcos Silva", label: "Marcos" },
      { match: "Almir", label: "Almir" },
      { match: "Kauan", label: "Kauan" }
    ]
  }
];

export const TEAM_MATCHES = GESTAO_PANELS.flatMap((p) => p.users.map((u) => u.match));
