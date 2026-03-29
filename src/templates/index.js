import chalk from 'chalk';

export const templateRegistry = {
  fec: {
    name: 'FEC - Fichier des Écritures Comptables',
    description: 'Analyse complète du FEC: balance, journaux, KPIs, conformité',
    dataFile: 'fec-mock.json',
    slides: 10
  },
  consolidation: {
    name: 'Consolidation Groupe',
    description: 'Périmètre, éliminations IC, P&L et bilan consolidés, effets de change',
    dataFile: 'consolidation-mock.json',
    slides: 10
  },
  'revenue-model': {
    name: 'Revenue Model',
    description: 'Flux de revenus, unit economics, cohortes, projections',
    dataFile: 'revenue-mock.json',
    slides: 10
  }
};

export function listTemplates() {
  console.log('\n' + chalk.hex('#6C5CE7').bold('  Templates disponibles') + '\n');
  for (const [key, tpl] of Object.entries(templateRegistry)) {
    console.log(`  ${chalk.hex('#00B894').bold(key.padEnd(18))} ${tpl.name}`);
    console.log(`  ${''.padEnd(18)} ${chalk.dim(tpl.description)}`);
    console.log(`  ${''.padEnd(18)} ${chalk.dim(`${tpl.slides} slides • données: ${tpl.dataFile}`)}\n`);
  }
}

export function getTemplate(name) {
  const tpl = templateRegistry[name];
  if (!tpl) {
    const available = Object.keys(templateRegistry).join(', ');
    throw new Error(`Template "${name}" inconnu. Disponibles: ${available}`);
  }
  return tpl;
}
