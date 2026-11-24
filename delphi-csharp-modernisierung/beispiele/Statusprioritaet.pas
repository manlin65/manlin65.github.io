unit Statusprioritaet;

interface

function StatusPriority(Code: Integer): Integer;

implementation

function StatusPriority(Code: Integer): Integer;
begin
  if Code = 503 then
    Result := 4
  else if Code >= 500 then
    Result := 3
  else if Code >= 400 then
    Result := 2
  else if Code < 100 then
    Result := -1
  else
    Result := 0;
end;

end.
