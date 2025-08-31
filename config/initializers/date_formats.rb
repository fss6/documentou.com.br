# Configuração de formatos de data aceitos pelo Rails
Date::DATE_FORMATS[:default] = "%Y-%m-%d"
Time::DATE_FORMATS[:default] = "%Y-%m-%d %H:%M:%S"

# Adicionar formatos customizados que o Rails pode parsear
Date::DATE_FORMATS[:flatpickr] = "%Y-%m-%d"
Time::DATE_FORMATS[:flatpickr] = "%Y-%m-%d %H:%M"

# Configurar o parser de datas para aceitar o formato do Flatpickr
Date::DATE_FORMATS[:flatpickr_parse] = "%Y-%m-%d"
Time::DATE_FORMATS[:flatpickr_parse] = "%Y-%m-%d %H:%M"
