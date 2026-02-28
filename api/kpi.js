html,body{
  margin:0;
  padding:0;
  background:#0b1220;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto;
}

.wrapper{
  padding:60px 40px;
  max-width:1400px;
  margin:auto;
}

.section-label{
  font-size:14px;
  letter-spacing:1.6px;
  text-transform:uppercase;
  color:#64748b;
  margin:60px 0 24px;
  font-weight:600;
}

.section-label:first-of-type{
  margin-top:0;
}

.kpi-row{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:28px;
}

.card{
  padding:32px;
  border-radius:20px;
  background:linear-gradient(145deg,#0f1c33,#0c172a);
  border:1px solid rgba(255,255,255,0.05);
  box-shadow:
    0 20px 40px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255,255,255,0.03);
  transition:all 0.25s ease;
}

.card:hover{
  transform:translateY(-6px);
  border:1px solid rgba(96,165,250,0.4);
  box-shadow:
    0 25px 50px rgba(0,0,0,0.7),
    0 0 0 1px rgba(96,165,250,0.15);
}

.label{
  font-size:12px;
  letter-spacing:1.2px;
  color:#94a3b8;
  margin-bottom:18px;
  font-weight:500;
}

.value{
  font-size:28px;
  font-weight:700;
  letter-spacing:0.5px;
}

@media(max-width:1000px){
  .kpi-row{grid-template-columns:repeat(2,1fr)}
}

@media(max-width:600px){
  .kpi-row{grid-template-columns:1fr}
  .wrapper{padding:40px 20px}
}
