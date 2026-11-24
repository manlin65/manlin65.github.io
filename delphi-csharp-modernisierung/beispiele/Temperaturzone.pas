unit Temperaturzone;

interface

function TemperatureBand(Celsius: Integer): Integer;

implementation

function TemperatureBand(Celsius: Integer): Integer;
begin
  if Celsius < -10 then
    Result := 0
  else if Celsius <= 0 then
    Result := 1
  else
    Result := 2;
end;

end.
