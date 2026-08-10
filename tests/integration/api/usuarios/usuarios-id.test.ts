import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'
import { reqComoAdmin, reqComoComum, jsonBody } from '@/tests/helpers'
import { PUT, DELETE } from '@/app/api/usuarios/[id]/route'

function url(id: string) {
  return `http://localhost/api/usuarios/${id}`
}

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) }
}

let idComum: string
let idUnicoAdmin: string

beforeAll(async () => {
  const senhaHash = await bcrypt.hash('senha123', 10)

  const [comum] = await sql`
    INSERT INTO usuarios (usuario, nome, senha_hash, role)
    VALUES (${`teste_put_comum_${Date.now()}`}, 'Comum de Teste', ${senhaHash}, 'comum')
    RETURNING id
  `
  idComum = comum.id

  const [admin] = await sql`
    INSERT INTO usuarios (usuario, nome, senha_hash, role)
    VALUES (${`teste_unico_admin_${Date.now()}`}, 'Admin de Teste', ${senhaHash}, 'admin')
    RETURNING id
  `
  idUnicoAdmin = admin.id
})

afterAll(async () => {
  await sql`DELETE FROM usuarios WHERE id IN (${idComum}, ${idUnicoAdmin})`
  await sql.end()
})

describe('PUT /api/usuarios/[id]', () => {
  it('rejeita usuário comum (403)', async () => {
    const req = await reqComoComum(url(idComum), { method: 'PUT', ...jsonBody({ role: 'admin' }) })
    const res = await PUT(req, paramsFor(idComum))
    expect(res.status).toBe(403)
  })

  it('admin promove um usuário comum a admin', async () => {
    const req = await reqComoAdmin(url(idComum), { method: 'PUT', ...jsonBody({ role: 'admin' }) })
    const res = await PUT(req, paramsFor(idComum))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.usuario.role).toBe('admin')

    // devolve pro estado original, pra não afetar outros testes
    await sql`UPDATE usuarios SET role = 'comum' WHERE id = ${idComum}`
  })

  it('retorna 404 para id inexistente', async () => {
    const idFalso = '00000000-0000-0000-0000-000000000000'
    const req = await reqComoAdmin(url(idFalso), { method: 'PUT', ...jsonBody({ role: 'admin' }) })
    const res = await PUT(req, paramsFor(idFalso))
    expect(res.status).toBe(404)
  })

  it('marca e desmarca a tag de Business Partner', async () => {
    const marcar = await reqComoAdmin(url(idComum), { method: 'PUT', ...jsonBody({ is_business_partner: true }) })
    const resMarcar = await PUT(marcar, paramsFor(idComum))
    expect((await resMarcar.json()).usuario.is_business_partner).toBe(true)

    const desmarcar = await reqComoAdmin(url(idComum), { method: 'PUT', ...jsonBody({ is_business_partner: false }) })
    const resDesmarcar = await PUT(desmarcar, paramsFor(idComum))
    expect((await resDesmarcar.json()).usuario.is_business_partner).toBe(false)
  })
})

describe('DELETE /api/usuarios/[id]', () => {
  it('rejeita usuário comum (403)', async () => {
    const req = await reqComoComum(url(idComum))
    const res = await DELETE(req, paramsFor(idComum))
    expect(res.status).toBe(403)
  })

  it('bloqueia excluir o próprio usuário', async () => {
    // sessão cujo uid é o mesmo id que está tentando excluir
    const req = await reqComoAdmin(url(idUnicoAdmin), {}, idUnicoAdmin)
    const res = await DELETE(req, paramsFor(idUnicoAdmin))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/próprio usuário/)
  })

  it('bloqueia excluir o único administrador restante', async () => {
    // sessão de "outro" admin (uid diferente do alvo) tentando excluir o único admin real da tabela
    const req = await reqComoAdmin(url(idUnicoAdmin), {}, 'outro-admin-uid')
    const res = await DELETE(req, paramsFor(idUnicoAdmin))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/único administrador/)
  })

  it('admin exclui um usuário comum com sucesso', async () => {
    const req = await reqComoAdmin(url(idComum), {}, 'outro-admin-uid')
    const res = await DELETE(req, paramsFor(idComum))
    expect(res.status).toBe(200)

    const [ainda] = await sql`SELECT id FROM usuarios WHERE id = ${idComum}`
    expect(ainda).toBeUndefined()
  })
})
