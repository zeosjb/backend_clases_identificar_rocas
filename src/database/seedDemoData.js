const referenceData = {
  Type: [
    { name: 'Ignea' },
    { name: 'Sedimentaria' },
    { name: 'Metamorfica' }
  ],
  Category: [
    { name: 'Volcanica', description: 'Rocas formadas por solidificacion de lava en superficie.' },
    { name: 'Plutonica', description: 'Rocas formadas por solidificacion lenta del magma en profundidad.' },
    { name: 'Clastica', description: 'Rocas sedimentarias formadas por fragmentos compactados.' },
    { name: 'Foliada', description: 'Rocas metamorfoseadas con minerales alineados en planos.' }
  ],
  Role: [
    { name: 'Estudiante' },
    { name: 'Docente' }
  ],
  Achievement: [
    { slug: 'primera-roca', name: 'Primera roca', description: 'Explora una roca del catalogo.', experience: 10 },
    { slug: 'catalogo-inicial', name: 'Catalogo inicial', description: 'Consulta varias rocas del catalogo.', experience: 25 }
  ]
}

const rockData = [
  { type: 'Ignea', category: 'Volcanica', index: 1, name: 'Basalto', scientificName: 'Basalt', description: 'Roca volcanica oscura de grano fino.', composition: 'Plagioclasa y piroxeno', formula: 'Variable', environment: 'Coladas de lava', commonUses: 'Construccion y pavimentos', hardness: 6, streak: 'Gris', color: 'Negro a gris oscuro', texture: 'Afanitica', density: 2.9, transparency: 0, tenacity: 1, imgUrl: 'https://example.org/basalt.jpg', mindatUrl: 'https://www.mindat.org/' },
  { type: 'Ignea', category: 'Plutonica', index: 2, name: 'Granito', scientificName: 'Granite', description: 'Roca plutonica de grano visible, rica en cuarzo y feldespato.', composition: 'Cuarzo, feldespato y mica', formula: 'Variable', environment: 'Intrusiones magmaticas', commonUses: 'Construccion y ornamentacion', hardness: 6, streak: 'Blanca', color: 'Claro con granos visibles', texture: 'Faneritica', density: 2.7, transparency: 0, tenacity: 1, imgUrl: 'https://example.org/granite.jpg', mindatUrl: 'https://www.mindat.org/' },
  { type: 'Sedimentaria', category: 'Clastica', index: 3, name: 'Arenisca', scientificName: 'Sandstone', description: 'Roca formada principalmente por granos de arena cementados.', composition: 'Granos de cuarzo y otros minerales', formula: 'Variable', environment: 'Playas, rios y desiertos', commonUses: 'Construccion y estudio de ambientes antiguos', hardness: 6, streak: 'Blanca', color: 'Variable, frecuentemente beige', texture: 'Clastica', density: 2.3, transparency: 0, tenacity: 1, imgUrl: 'https://example.org/sandstone.jpg', mindatUrl: 'https://www.mindat.org/' },
  { type: 'Metamorfica', category: 'Foliada', index: 4, name: 'Pizarra', scientificName: 'Slate', description: 'Roca metamorfica de grano fino que se separa en laminas.', composition: 'Micas y cuarzo', formula: 'Variable', environment: 'Metamorfismo regional de bajo grado', commonUses: 'Cubiertas y revestimientos', hardness: 4, streak: 'Gris claro', color: 'Gris oscuro', texture: 'Foliada', density: 2.7, transparency: 0, tenacity: 1, imgUrl: 'https://example.org/slate.jpg', mindatUrl: 'https://www.mindat.org/' }
]

async function findOrCreateByNaturalKey(model, where, values) {
  const existing = await model.findOne({ where, paranoid: false })
  if (existing) return existing
  return model.create(values)
}

async function nextAvailableRockIndex(Rock, preferredIndex) {
  let index = preferredIndex
  while (await Rock.findOne({ where: { index }, paranoid: false })) index += 1
  return index
}

async function seedDemoData(models) {
  const references = {}
  for (const [modelName, records] of Object.entries(referenceData)) {
    const model = models[modelName]
    if (!model) throw new Error(`Cannot seed demo data: model ${modelName} is unavailable.`)
    references[modelName] = new Map()
    for (const record of records) {
      const key = modelName === 'Achievement' ? 'slug' : 'name'
      const row = await findOrCreateByNaturalKey(model, { [key]: record[key] }, record)
      references[modelName].set(record[key], row)
    }
  }

  const Rock = models.Rock
  if (!Rock) throw new Error('Cannot seed demo data: model Rock is unavailable.')
  for (const rock of rockData) {
    const type = references.Type.get(rock.type)
    const category = references.Category.get(rock.category)
    if (!type || !category) throw new Error(`Cannot seed demo data: missing reference for ${rock.scientificName}.`)
    const existing = await Rock.findOne({ where: { scientificName: rock.scientificName }, paranoid: false })
    if (existing) continue

    const { type: _type, category: _category, ...values } = rock
    const index = await nextAvailableRockIndex(Rock, values.index)
    await Rock.create({
      ...values,
      index,
      typeId: type.id,
      categoryId: category.id
    })
  }
}

module.exports = { seedDemoData }
